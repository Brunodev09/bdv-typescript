import { IBehaviorData } from './IBehaviorData';
import { IBehaviorBuilder } from './IBehaviorBuilder';
import { IBehavior } from './IBehavior';
import { BaseBehavior } from './baseBehavior';
import { BehaviorManager } from './behaviorManager';
import { AnimatedSpriteComponent } from '../components/animatedSpriteComponent';

/**
 * Behavior that manages animation states on an AnimatedSpriteComponent.
 *
 * Define named states, each with a frame sequence. Call setState() to switch.
 * The behavior finds the AnimatedSpriteComponent on its owner and swaps
 * the frame sequence when the state changes.
 *
 * Usage (programmatic):
 *   let data = new StatefulAnimationBehaviorData();
 *   data.name = "animState";
 *   data.componentName = "myAnimSprite"; // name of the AnimatedSpriteComponent
 *   let behavior = new StatefulAnimationBehavior(data);
 *   behavior.addState("idle", [0]);
 *   behavior.addState("walk_right", [1, 2, 3, 4, 5, 6, 7]);
 *   behavior.addState("walk_left", [8, 9, 10, 11, 12, 13, 14]);
 *   behavior.setState("idle");
 *
 * Usage (from JSON):
 *   {
 *     "type": "statefulAnimation",
 *     "name": "animState",
 *     "componentName": "myAnimSprite",
 *     "states": {
 *       "idle": [0],
 *       "walk_right": [1, 2, 3, 4, 5, 6, 7],
 *       "walk_left": [8, 9, 10, 11, 12, 13, 14]
 *     },
 *     "defaultState": "idle"
 *   }
 */

export class StatefulAnimationBehaviorData implements IBehaviorData {
  public name!: string;
  public componentName: string = "";
  public states: { [name: string]: number[] } = {};
  public defaultState: string = "";
  public frameTime: number = 100;

  public setFromJson(json: any): void {
    if (json.name === undefined) throw new Error("Name must be defined in behavior data.");
    this.name = String(json.name);
    if (json.componentName !== undefined) this.componentName = String(json.componentName);
    if (json.states !== undefined) this.states = json.states;
    if (json.defaultState !== undefined) this.defaultState = String(json.defaultState);
    if (json.frameTime !== undefined) this.frameTime = Number(json.frameTime);
  }
}

export class StatefulAnimationBehaviorBuilder implements IBehaviorBuilder {
  public get type(): string { return "statefulAnimation"; }

  public buildFromJson(json: any): IBehavior {
    let data = new StatefulAnimationBehaviorData();
    data.setFromJson(json);
    return new StatefulAnimationBehavior(data);
  }
}

export class StatefulAnimationBehavior extends BaseBehavior {
  private states: Map<string, number[]> = new Map();
  private currentState: string = "";
  private componentName: string;
  private component: any = null;
  private frameTime: number;

  public constructor(data: StatefulAnimationBehaviorData) {
    super(data);
    this.componentName = data.componentName;
    this.frameTime = data.frameTime;

    // Load states from data
    for (let key in data.states) {
      this.states.set(key, data.states[key]);
    }
    if (data.defaultState) {
      this.currentState = data.defaultState;
    }
  }

  /** Add or replace an animation state. */
  public addState(name: string, frameSequence: number[]): void {
    this.states.set(name, frameSequence);
    if (this.currentState === "") this.currentState = name;
  }

  /** Switch to a named state. Does nothing if already in that state. */
  public setState(name: string): void {
    if (name === this.currentState) return;
    if (!this.states.has(name)) return;

    this.currentState = name;
    this.resolveComponent();
    if (this.component) {
      let seq = this.states.get(name)!;
      this.component.sprite.setFrameSequence(seq);
      this.component.sprite.setFrameTime(this.frameTime);
    }
  }

  /** Get the current state name. */
  public getState(): string {
    return this.currentState;
  }

  public update(time: number): void {
    // Apply default state on first update if component not resolved yet
    if (!this.component) {
      this.resolveComponent();
      if (this.component && this.currentState) {
        let seq = this.states.get(this.currentState);
        if (seq) {
          (this.component as any).sprite.setFrameSequence(seq);
          (this.component as any).sprite.setFrameTime(this.frameTime);
        }
      }
    }
  }

  private resolveComponent(): void {
    if (this.component || !this._owner) return;

    let comp = this._owner.getComponent(this.componentName);
    if (comp && comp instanceof AnimatedSpriteComponent) {
      this.component = comp;
    }
  }
}

BehaviorManager.registerBuilder(new StatefulAnimationBehaviorBuilder());

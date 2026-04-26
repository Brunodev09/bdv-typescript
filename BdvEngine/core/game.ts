import { Shader } from './gl/shader';
import { Camera2D } from './camera2d';

export abstract class Game {
    /** Set by the engine before init(). Access camera position/zoom. */
    public camera!: Camera2D;

    abstract init(): void;
    abstract update(deltaTime: number): void;
    abstract render(shader: Shader): void;
}

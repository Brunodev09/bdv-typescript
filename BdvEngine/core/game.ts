import { Shader } from './gl/shader';

export abstract class Game {
    abstract init(): void;
    abstract update(deltaTime: number): void;
    abstract render(shader: Shader): void;
}

import { Engine } from '../BdvEngine';
import { CollisionGame } from './collisionGame';

let engine: Engine;
window.onload = () => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "mainFrame";
  document.body.appendChild(canvas);
  engine = new Engine(canvas, new CollisionGame(), {
    targetFps: 60,
    showStats: true,
  });
  engine.start();
};

window.onresize = () => {
  engine.resize();
};

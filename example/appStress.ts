import { Engine } from '../BdvEngine';
import { StressGame } from './stressGame';

let engine: Engine;
window.onload = () => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "mainFrame";
  document.body.appendChild(canvas);
  engine = new Engine(canvas, new StressGame(), {
    targetFps: 0, // uncapped to see true performance
    showStats: true,
  });
  engine.start();
};

window.onresize = () => {
  engine.resize();
};

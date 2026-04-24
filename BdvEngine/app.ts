import { Engine } from './core/engine';

let engine: Engine;
window.onload = () => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "mainFrame";
  document.body.appendChild(canvas);
  engine = new Engine(canvas);
  engine.start();
};

window.onresize = () => {
  engine.resize();
};

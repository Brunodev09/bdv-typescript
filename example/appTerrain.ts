import { Engine } from '../BdvEngine';
import { TerrainGame } from './terrainGame';

let engine: Engine;
window.onload = () => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "mainFrame";
  document.body.appendChild(canvas);
  engine = new Engine(canvas, new TerrainGame(), {
    targetFps: 60,
    showFps: true,
  });
  engine.start();
};

window.onresize = () => {
  engine.resize();
};

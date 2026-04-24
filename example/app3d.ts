import { Engine3D } from '../BdvEngine/core/engine3d';
import { My3DGame } from './my3DGame';

let engine: Engine3D;
window.onload = () => {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "mainFrame";
  document.body.appendChild(canvas);

  let game = new My3DGame();
  engine = new Engine3D(canvas, game, {
    targetFps: 60,
    showFps: true,
    clearColor: [0.1, 0.1, 0.15, 1],
  });
  game.setEngine(engine);
  engine.start();
};

window.onresize = () => {
  engine.resize();
};

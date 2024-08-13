let engine: BdvEngine.Engine;
window.onload = () => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.id = 'mainFrame';
    document.body.appendChild(canvas);
    engine = new BdvEngine.Engine(canvas);
    engine.start();
};

window.onresize = () => {
    engine.resize();
};

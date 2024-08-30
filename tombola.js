
// Module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// Create an engine
var engine = Engine.create();

// Create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

// Create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

// Add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);

// Run the renderer
Render.run(render);

// Create runner
var runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

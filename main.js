import AudioEngine from "./audioEngine.js";

const audioEngine = new AudioEngine(true);

/*====================================SOUND STUFF====================================*/



/*=============================TOMBOLA STUFF===============================*/
// Module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events;

// Create an engine
const engine = Engine.create();

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine
});

// Create a ground
const ground = Bodies.rectangle(400, 610, 810, 60, {isStatic: true});
ground.restitution = 0.999;

// Add the ground to the world
Composite.add(engine.world, [ground]);

// Run the renderer
Render.run(render);

// Create runner
const runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

const balls = []; // Array to store all balls

// Function to spawn a bouncy ball at a random position
function spawnBall() {
    const randomX = Math.random() * 800; // X position between 0 and 800
    const randomPitch = Math.random() * 1000 + 100;
    const oscillator = audioEngine.startOscillator(
    { frequency: randomPitch, waveform: "sawtooth", attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 });
    // Create a ball with a high restitution (bounciness)
    const ball = Bodies.circle(randomX, 0, 20, {

    });
    ball.frictionAir = 0.001;

    ball.slop = 0.9;
    ball.restitution = 0.9;
    ball.density = 0.5;
    ball.customId = balls.length + 1;    // Add a custom ID to the ball
    ball.oscillator = oscillator;        // Add the oscillator to the ball
    Composite.add(engine.world, ball);     // Add the ball to the world and the balls array
    balls.push(ball); // Important: Add the ball to the balls array
    /*create oscillators*/
}

// Listen for collisions
Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;

    pairs.forEach(function(pair) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if the collision involves any ball and the ground
        balls.forEach(function(ball) {
            if ((bodyA === ball && bodyB === ground) || (bodyA === ground && bodyB === ball)) {
               /* console.log('Ball collided with the ground!');*/
                // trigger event action here for ball collision
                ball.oscillator.triggerAttackRelease()

            }
        });
    });
});


/*=============================UI STUFF===============================*/
document.addEventListener('DOMContentLoaded', function() {

    const startAudioButton = document.getElementById('startAudioButton');

    startAudioButton.addEventListener('click', function() {
        // Initialise audio engine
        audioEngine.initAudioEngine();
        audioEngine.loadImpulseResponse("impulse-response.wav");
        document.getElementById('spawnButton').addEventListener('click', function() {
            spawnBall();
        });
    });
});
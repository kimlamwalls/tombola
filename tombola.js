import AudioEngine from "./audioEngine.js";

const audioEngine = new AudioEngine(true);



/*=============================SOUND STUFF===========*/


/*on document ready init audio engine*/
document.addEventListener('DOMContentLoaded', function() {


    const startAudioButton = document.getElementById('startAudioButton');
    startAudioButton.addEventListener('click', function() {
        //initialise audio engine
        audioEngine.initAudioEngine();
        audioEngine.loadImpulseResponse("impulse-response.wav");
        audioEngine.startOscillator();
    });

});

// Module aliases
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// Create an engine
const engine = Engine.create();

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine
});


// Create a ground
const ground = Bodies.rectangle(400, 610, 810, 60, {isStatic: true});

// Add the ground to the world
Composite.add(engine.world, [ground]);

// Run the renderer
Render.run(render);

// Create runner
const runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

// Function to spawn a bouncy ball at a random position
function spawnBall() {
    const randomX = Math.random() * 800; // X position between 0 and 800

    // Create a ball with a high restitution (bounciness)
    const ball = Bodies.circle(randomX, 0, 20, {
        restitution: 0.9 // Value close to 1 for high bounciness
    });

    // Add the ball to the world
    Composite.add(engine.world, ball);
}

// Event listener for the button click
document.getElementById('spawnButton').addEventListener('click', function() {
    spawnBall();
});


const balls = []; // Array to store all balls

// Listen for collisions
Matter.Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;

    pairs.forEach(function(pair) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check if the collision involves any ball and the ground
        balls.forEach(function(ball) {
            if ((bodyA === ball && bodyB === ground) || (bodyA === ground && bodyB === ball)) {
                console.log('Ball collided with the ground!');
                // Trigger your event here
            }
        });
    });
});
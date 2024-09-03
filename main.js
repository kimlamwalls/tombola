import AudioEngine from "./audioEngine.js";
import { PitchQuantizer, Note } from "./pitchQuantizer.js";

const audioEngine = new AudioEngine(true);

/*====================================SOUND STUFF====================================*/

const pitchQuantizer = new PitchQuantizer(true);



/*=============================TOMBOLA STUFF===============================*/
const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Vertices = Matter.Vertices,
    Body = Matter.Body,  // Add this line
    Events = Matter.Events;

// Create an engine
const engine = Engine.create();


const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 400, // Set desired width
        height: 700 // Set desired height
    }
});

// Create a ground
const ground = Bodies.rectangle(200, 690, 400, 60, { isStatic: true });

// Create walls
const leftWall = Bodies.rectangle(10, 350, 20, 700, { isStatic: true });
const rightWall = Bodies.rectangle(390, 350, 20, 700, { isStatic: true });

// Angle walls by 5 degrees (convert degrees to radians)
const angle = 7 * (Math.PI / 180);

// Apply rotation to walls
Body.setAngle(leftWall, -angle); // Negative angle for left wall to angle outward
Body.setAngle(rightWall, angle); // Positive angle for right wall to angle outward

// Define vertices for a regular pentagon
const pentagonVertices = Vertices.fromPath('0 50 47 15 29 -40 -29 -40 -47 15');

const tombolaShapeXY = [200,300]
const tombolaSides = 5;
const tombolaRadius = 30;

function createPolygon(x, y, sides, radius) {
    // Generate the vertices for a regular polygon
    const angle = (2 * Math.PI) / sides;
    const vertices = [];
    for (let i = 0; i < sides; i++) {
        const vertexX = x + radius * Math.cos(i * angle);
        const vertexY = y + radius * Math.sin(i * angle);
        vertices.push({ x: vertexX, y: vertexY });
    }

    // Create a Matter.js body from the vertices
    return Matter.Bodies.fromVertices(x, y, vertices);
}

const tombola = createPolygon(tombolaShapeXY[0], tombolaShapeXY[1], tombolaSides, tombolaRadius);

// Create a pentagon body
const pentagon = Bodies.fromVertices(100, 50, [pentagonVertices], {});

// Create a constraint to keep the pentagon anchored at its center
const constraint = Matter.Constraint.create({
    pointA: { x: 100, y: 50 }, // Central axis
    bodyB: tombola,
    pointB: { x: 0, y: 0 }, // Offset within the pentagon (center)
    stiffness: 1 // No flexibility
});
// Add the pentagon and the constraint to the world
Composite.add(engine.world, [tombola, constraint]);

// Function to rotate the pentagon
function rotateBody(body) {
    body.angle += 0.01; // Add a small angle to the body's angle
    Matter.Body.setAngularVelocity(body, 0.1); // Set angular velocity
}
// Add the ground and walls to the world
Composite.add(engine.world, [ground, leftWall, rightWall]);

// Run the renderer
Render.run(render);

// Create runner
const runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

console.log(pentagon);
setInterval(() => rotateBody(pentagon), 1000);


const balls = []; // Array to store all balls

// Function to spawn a bouncy ball at a random position
function spawnBall() {
    const randomX = Math.random() * 400; // X position between 0 and 800
    const randomPitch = Math.random() * 1200 + 0; // Random pitch between 100 and 1100
    const quantizedPitch = pitchQuantizer.nearestSemitone(randomPitch).frequency;
    const oscillator = audioEngine.startOscillator(
    { frequency: quantizedPitch, waveform: "sawtooth", attack: 0.05, decay: 0.5, sustain: 0.7, release: 1 });
    const ball = Bodies.circle(randomX, 100, 8, {

    });
    ball.frictionAir = 0.0009;
    ball.slop = 0.5;
    ball.restitution = 1.17;
    ball.density = 1;
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

        audioEngine.loadImpulseResponse("mediumPlate.wav");
        document.getElementById('spawnButton').addEventListener('click', function() {
            spawnBall();
        });
    });
});
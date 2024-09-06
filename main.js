import AudioEngine from "./audioEngine.js";
import {PitchQuantizer} from "./pitchQuantizer.js";

const debug = true;

const audioEngine = new AudioEngine(true);

/*====================================SOUND STUFF====================================*/

const pitchQuantizer = new PitchQuantizer(true);
let maxPitch = 600;
let minPitch = 50;
let attack = 0.05;
let release = 0.05;

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
    element: document.getElementById('canvas'),
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


let balls = []; // Array to store all balls

// Function to spawn a bouncy ball at a random position
function spawnBall(attack, release, maxPitch, minPitch) {
    const randomX = Math.random() * 400; // X position between 0 and 800
    const randomPitch = Math.random() * (maxPitch - minPitch) + minPitch; // Random pitch between min and max
    const quantizedPitch = pitchQuantizer.nearestSemitone(randomPitch).frequency;
    const oscillator = audioEngine.createOscillatorVoice(
    { frequency: quantizedPitch, waveform: "sawtooth", attack: attack, decay: 0.5, sustain: 0.7, release: release });
    const ball = Bodies.circle(randomX, 100, 8, {
        label: "ball",
    });
    ball.frictionAir = 0.0011;
    ball.slop = 0.5;
    ball.restitution = 1.17;
    ball.density = 1;
    ball.customId = balls.length + 1;    // Add a custom ID to the ball
    ball.oscillator = oscillator;        // Add the oscillator to the ball
    ball.isBall = true;                  // Add a flag to the ball
    Composite.add(engine.world, ball);     // Add the ball to the world and the balls array
    balls.push(ball); // Important: Add the ball to the balls array
    if (debug) console.log("spawnBall called with attack: " + attack + " and release: " + release + " and maxPitch: " + maxPitch + " and minPitch: " + minPitch);
    if (debug) console.log("Ball created with pitch: " + quantizedPitch);
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
    let autoSpawnIntervalId = null; // Store the interval ID
    engine.timing.timeScale = document.getElementById('simulationSpeed').value;

    // Initialise audio engine
    function initializeAudioEngine() {
        if (!audioEngine.isInitialised) {
            audioEngine.initAudioEngine();
            audioEngine.loadImpulseResponse("mediumPlate.wav");
        }
    }

    // Spawn Ball
    function spawnBallHandler() {
        const attack = parseFloat(document.getElementById('attack').value);
        const release = parseFloat(document.getElementById('release').value);
        spawnBall(attack, release, maxPitch, minPitch);
    }

    document.getElementById('spawnButton').addEventListener('click', function() {
        initializeAudioEngine();
        spawnBallHandler();
    });

    document.getElementById('autoSpawnToggle').addEventListener('sl-change', function() {
        if (this.checked) {
            initializeAudioEngine();
            const interval = parseInt(document.getElementById('autoSpawnTimer').value, 10);
            // Clear any existing interval
            if (autoSpawnIntervalId !== null) {
                clearInterval(autoSpawnIntervalId);
            }
            // Start a new interval
            autoSpawnIntervalId = setInterval(spawnBallHandler, interval);
        } else {
            // Clear the interval
            if (autoSpawnIntervalId !== null) {
                clearInterval(autoSpawnIntervalId);
                autoSpawnIntervalId = null;
            }
        }
    });

    document.getElementById('simulationSpeed').addEventListener('sl-change', function() {
        engine.timing.timeScale = parseFloat(this.value);
    });

    document.getElementById('attack').addEventListener('sl-change', function() {
        const attackValue = parseFloat(this.value);
        // Loop through balls and change attack for each oscillator
 /*       for (let i = 0; i < balls.length; i++) {
            balls[i].oscillator.setAttack(attackValue);
        }*/
    });

    document.getElementById('release').addEventListener('sl-change', function() {
        const releaseValue = parseFloat(this.value);
        // Loop through balls and change release for each oscillator
/*        for (let i = 0; i < balls.length; i++) {
            balls[i].oscillator.setRelease(releaseValue);
        }*/
    });

    document.getElementById('maxPitch').addEventListener('sl-change', function() {
        maxPitch = parseFloat(this.value);
    });

    document.getElementById('minPitch').addEventListener('sl-change', function() {
        minPitch = parseFloat(this.value);
    });

    document.getElementById('bounciness').addEventListener('sl-change', function() {
        const bouncinessValue = parseFloat(this.value);
        // Loop through balls and change bounciness for each oscillator
        for (let i = 0; i < balls.length; i++) {
            balls[i].restitution = bouncinessValue;
        }
    });

    document.getElementById('clearBallsButton').addEventListener('click', function() {
        // Iterate over the balls array
        const ballsInWorld = Composite.allBodies(engine.world).filter(body => body.label === 'ball');

// Log the found balls
        console.log(ballsInWorld);

        // Iterate over the ballsInWorld array
        for (let i = 0; i < ballsInWorld.length; i++) {
            // Remove the ball from the world
            Composite.remove(engine.world, ballsInWorld[i]);
            // Remove the ball from the balls array
            balls = balls.filter(ball => ball !== ballsInWorld[i]);
        }


        // Clear the balls array
        balls = [];
    });


});


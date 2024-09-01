import AudioEngine from "./audioEngine.js";

const audioEngine = new AudioEngine(true);

/*====================================SOUND STUFF====================================*/



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

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine
});

// Create a ground
const ground = Bodies.rectangle(400, 610, 810, 60, {isStatic: true});

const tombolaShapeXY = [400,200]
const tombolaSides = 5;
const tombolaRadius = 300;

function createPolygon(x, y, sides, outerRadius, innerRadius) {
    const angle = (2 * Math.PI) / sides;
    const outerVertices = [];
    const innerVertices = [];

    // Generate outer vertices
    for (let i = 0; i < sides; i++) {
        const outerX = x + outerRadius * Math.cos(i * angle);
        const outerY = y + outerRadius * Math.sin(i * angle);
        outerVertices.push({ x: outerX, y: outerY });
    }

    // Generate inner vertices
    for (let i = 0; i < sides; i++) {
        const innerX = x + innerRadius * Math.cos((i + 0.5) * angle); // Offset for inner vertices
        const innerY = y + innerRadius * Math.sin((i + 0.5) * angle);
        innerVertices.push({ x: innerX, y: innerY });
    }

    // Create outer and inner convex bodies
    const outerPolygon = Bodies.fromVertices(x, y, [outerVertices], {
        isStatic: true,
        render: {
            fillStyle: 'blue',
        },
    });

    const innerPolygon = Bodies.fromVertices(x, y, [innerVertices], {
        isStatic: true,
        render: {
            fillStyle: 'white', // Or transparent if you prefer
        },
    });

    // Combine shapes into a compound body
    const hollowBody = Composite.create();
    Composite.add(hollowBody, [outerPolygon, innerPolygon]);

    return hollowBody;
}


const tombola = createPolygon(tombolaShapeXY[0], tombolaShapeXY[1], tombolaSides, tombolaRadius);

// Create a constraint to keep the pentagon anchored at its center
const constraint = Matter.Constraint.create({
    pointA: { x: tombolaShapeXY[0], y: tombolaShapeXY[1] }, // Central axis
    bodyB: tombola,
    pointB: { x: 0, y: 0 }, // Offset within the pentagon (center)
    stiffness: 1 // No flexibility
});

// Function to rotate the pentagon
function rotateBody(body) {
    Matter.Body.setAngularVelocity(body, 0.01); // Set angular velocity
}
// Add the ground to the world
Composite.add(engine.world, [ground]);
// Add the pentagon and the constraint to the world
Composite.add(engine.world, [tombola, constraint]);


// Run the renderer
Render.run(render);

// Create runner
const runner = Runner.create();

// Run the engine
Runner.run(runner, engine);

console.log(tombola);

setInterval(rotateBody, 100, tombola);



const balls = []; // Array to store all balls

// Function to spawn a bouncy ball at a random position
function spawnBall() {
    const randomX = Math.random() * 800; // X position between 0 and 800
    const randomPitch = Math.random() * 1000 + 100;
    const oscillator = audioEngine.startOscillator(
    { frequency: randomPitch, waveform: "sawtooth", attack: 0.05, decay: 0.2, sustain: 0.7, release: 0.5 });
    // Create a ball with a high restitution (bounciness)
    const ball = Bodies.circle(300, 100, 10, {

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
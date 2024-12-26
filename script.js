/** @type {HTMLCanvasElement} */

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = (canvas.width = window.innerWidth);
const CANVAS_HEIGHT = (canvas.height = window.innerHeight);

const collisionCanvas = document.getElementById('collisionCanvas');
const collisionCtx = collisionCanvas.getContext('2d');
const COLLISION_CANVAS_WIDTH = (collisionCanvas.width = window.innerWidth);
const COLLISION_CANVAS_HEIGHT = (collisionCanvas.height = window.innerHeight);

let score = 0;
let gameOver = false;
//canvas global font
ctx.font = '50px Impact';

let timeToNextRaven = 0;
//interval in milliseconds
let ravenInterval = 500;
let lastTime = 0;

let ravens = [];
class Raven {
  constructor() {
    //width and height of single frame
    this.spriteWidth = 271;
    this.spriteHeight = 194;

    //Setting ravens in different sizes
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = (this.spriteWidth / 2) * this.sizeModifier;
    this.height = (this.spriteHeight / 2) * this.sizeModifier;

    //ravens will start fly from the right corner of screen
    this.x = CANVAS_WIDTH;
    this.y = Math.random() * (CANVAS_HEIGHT - this.height);

    //horizontal speed
    this.directionX = Math.random() * 5 + 3;

    //vertical movement of upwards(minus values) and downwards(plus values)
    this.directionY = Math.random() * 5 - 2.5;

    //ravens that passed the screen will be removed from the ravens array.
    //new ravens keep being created every 500 ms
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = './images/raven.png';
    this.frame = 0;
    this.maxFrame = 4;

    //ravens will flap wings slower then default:
    this.timeSliceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;

    //Setting random colors for every raven hit-box.
    this.randomColors = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
    this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;
    //only half the ravens will have particles trail
    this.hasTrail = Math.random() > 0.5;
  }

  update(deltatime) {
    //In case a raven gets close to top screen or to bottom it will reverse direction
    if (this.y < 0 || this.y > CANVAS_HEIGHT - this.height) {
      this.directionY *= -1;
    }
    this.x -= this.directionX;
    this.y += this.directionY;
    if (this.x < 0 - this.width) this.markedForDeletion = true;
    this.timeSliceFlap += deltatime;
    if (this.timeSliceFlap > this.flapInterval) {
      this.frame > this.maxFrame ? (this.frame = 0) : this.frame++;
      this.timeSliceFlap = 0;
      if (this.hasTrail) {
        for (let i = 0; i < 5; ++i) {
          particles.push(new Particle(this.x, this.y, this.width, this.color));
        }
      }
    }
    if (this.x < 0 - this.width) gameOver = true;
  }

  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);

    ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
  }
}

let explosions = [];
class Exploaion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = './images/boom.png';
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.x = x;
    this.y = y;
    this.size = size;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = './sounds/boom2.wav';
    this.timeSinceLastFrame = 0;
    this.frameInterval = 300;
    this.maxFrame = 4;
    this.markedForDeletion = false;
  }

  //deltaTime sent by animation-loop to time out animation
  update(deltaTime) {
    if (this.frame === 0) this.sound.play();
    this.timeSinceLastFrame += deltaTime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      if (this.frame > this.maxFrame) this.markedForDeletion = true;
      else this.timeSinceLastFrame = 0;
    }
  }
  draw() {
    ctx.drawImage(this.image, this.spriteWidth * this.frame, 0, this.spriteWidth, this.spriteHeight, this.x, this.y - this.size / 4, this.size, this.size);
  }
}

//Adding particles (circles traces when flipping wings)
let particles = [];
class Particle {
  constructor(x, y, size, color) {
    this.size = size;
    //'this.size/2' is set for the trailing to start after the raven.
    // 'Math.random() * 50 - 25' = is set to randomize the x and y coordinates of the trailing
    this.x = x + this.size / 2 + Math.random() * 50 - 25;
    this.y = y + this.size / 3 + Math.random() * 50 - 25;
    //radius of particles will correspond to the raven size
    this.radius = (Math.random() * this.size) / 10;
    this.maxRadius = Math.random() * 20 + 35;
    this.markedForDeletion = false;
    //the particles will move to right
    this.speedX = Math.random() * 1 + 0.5;
    this.color = color;
  }

  update() {
    this.x += this.speedX;
    //particle radius increase in 0.2 per frame
    this.radius += 0.5;

    //'this.maxRadius - 5' = set the particles to be marked for deletion abit sooner, when the opacity is correct and not opacity=1 i.e- fully seen.
    if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
  }

  draw() {
    //This method is engolfed with calls to save() + restore()- because the ravens are also affected by the call to 'ctx.globalAlpha' and are flickering. So save() saves the state of canvas and after the drawing of particles we restore it (to not leave affect on other objects drawned).
    ctx.save();

    //trailing particles will fade(opacity increased)
    ctx.globalAlpha = 1 - this.radius / this.maxRadius;
    //start the drawing
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScore() {
  ctx.fillStyle = 'black';
  ctx.fillText('Score:' + score, 50, 75);

  ctx.fillStyle = 'white';
  ctx.fillText('Score:' + score, 55, 80);
}

function drawGameOver() {
  ctx.textAlign = 'center';
  ctx.fillStyle = 'black';
  ctx.fillText('GAME OVER\n your score is ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = 'white';
  ctx.fillText('GAME OVER\n your score is ' + score, CANVAS_WIDTH / 2 + 5, CANVAS_HEIGHT / 2 + 5);
}

//clicking ravens before they disappear on the left edge of screen:
window.addEventListener('click', function (e) {
  //we will use collision detection by color.
  //getImageData() may trigger security error on some browsers, so therefore a second canvas is used that will contain only the hit-boxes of the ravens(without images that may invok the error)
  const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  const pc = detectPixelColor.data;

  //checking colisions:
  ravens.forEach((object) => {
    if (object.randomColors[0] === pc[0] && object.randomColors[1] === pc[1] && object.randomColors[2] === pc[2]) {
      //collision detected
      object.markedForDeletion = true;
      score++;
      explosions.push(new Exploaion(object.x, object.y, object.width));
    }
  });
});

//To make sure timimg in games are consistent and based on time in milliseconds rather then on power of the computer,
//timestamps is used. it will compare how many milliseconds elapsed since last loop and only when reaching certain amount of time between frames, we draw the next frame.
function animate(timestamp) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  collisionCtx.clearRect(0, 0, COLLISION_CANVAS_WIDTH, COLLISION_CANVAS_HEIGHT);

  let deltatime = timestamp - lastTime;
  lastTime = timestamp;
  timeToNextRaven += deltatime;
  if (timeToNextRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToNextRaven = 0;

    //sorting the array by raven size, so that smaller-sized ravens are painted in the back and larger in front-
    //to get depth feeling.
    ravens.sort(function (a, b) {
      return a.width - b.width;
    });
  }

  drawScore();

  [...ravens, ...explosions, ...particles].forEach((object) => object.update(deltatime));
  //particles are added first to array, so that the trails will be drawned behind the ravens
  [...particles, ...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);
  explosions = explosions.filter((object) => !object.markedForDeletion);
  particles = particles.filter((object) => !object.markedForDeletion);
  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
}

animate(0);

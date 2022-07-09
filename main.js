var canvas, ctx;

// zoom and offset
var zoom = 12.5;
var x = 0;
var y = 0;

// filling modes
const FULL = 1;
const EMPTY = 0;
const RANDOM = -1;

const INIT_MODE = EMPTY;
const EXTEND_MODE = EMPTY;

// animation variables
var isAnimated = false;
var step;

// the grid is a hashtable
var grid = {};

// compute hash from coordinates
function hash(x, y) {
    return x + "," + y;
}

// when doument is loaded, initialize canvas
window.onload = function () {
    initCanvas();
    initGrid();
    drawGrid();
    initEventListeners();
}

// initialize canvas
function initCanvas() {
    // get canvas
    canvas = document.getElementById('grid');
    // get context
    ctx = canvas.getContext('2d');
    // set canvas width and height
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // translate canvas to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // set canvas background color
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // set canvas color
    ctx.fillStyle = '#fff';
}

// initialize grid
function initGrid() {
    // fill grid with empty cells
    for (var i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (var j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            grid[hash(i, j)] = generate(i, j, mode = INIT_MODE, prob = 0.05);
        }
    }
}

// draw grid
function drawGrid() {
    // clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0 - canvas.width / 2, 0 - canvas.height / 2, canvas.width, canvas.height);
    // draw grid
    ctx.fillStyle = '#fff';

    for (var i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (var j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            if (grid[hash(i, j)] == 1) {
                ctx.fillRect((i - x) * zoom, (j - y) * zoom, zoom, zoom);
            }
        }
    }
}

// change canvas size when window is resized
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // refill canvas with background color
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    // add previously unseen cells to grid
    for (let i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (let j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            if (!(hash(i, j) in grid)) {
                grid[hash(i, j)] = generate(i, j, mode = EXTEND_MODE, prob = 0.05);
            }
        }
    }

    // draw grid
    drawGrid();
}

// move grid
function moveGrid(dx, dy) {
    x -= dx;
    y -= dy;

    for (let i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (let j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            if (!(hash(i, j) in grid)) {
                grid[hash(i, j)] = generate(i, j, mode = EXTEND_MODE, prob = 0.05);
            }
        }
    }

    // draw grid
    drawGrid();
}

// zoom grid
function zoomGrid(dz) {
    zoom += dz;

    // if zoom is too small, set it to 1
    if (zoom < 6) {
        zoom = 6;
    }

    // if zoom is too big, set it to max
    if (zoom > 100) {
        zoom = 100;
    }

    // add missing cells to grid
    for (let i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (let j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            if (!(hash(i, j) in grid)) {
                grid[hash(i, j)] = generate(i, j, mode = EXTEND_MODE, prob = 0.05);
            }
        }
    }

    drawGrid();
}

function generate(i, j, mode = FULL, prob = 0.5) {
    switch (mode) {
        case FULL:
            return 1;
        case EMPTY:
            return 0;
        case RANDOM:
            return Math.random() < prob ? 1 : 0;
        default:
            return Math.abs(i + j) % 2;
    }
}

function initEventListeners() {
    // move grid when mouse is dragged
    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        // if mouse isnt pressed return
        if (!e.buttons) {
            return;
        }

        let dx = e.movementX;
        let dy = e.movementY;

        moveGrid(dx / zoom, dy / zoom);
    });

    // zoom grid when mouse wheel is scrolled
    canvas.addEventListener('wheel', function (e) {
        let dz = e.deltaY;
        zoomGrid(dz / zoom);
    });

    // start animating when space is pressed
    document.addEventListener('keydown', function (e) {
        if (e.key == " ") {

            if (isAnimated) {
                isAnimated = false;
                window.cancelAnimationFrame(step);
                return;
            }

            isAnimated = true;
            animate();
        }
    });

    // reset grid when r is pressed
    document.addEventListener('keydown', function (e) {
        if (e.key == "r") {
            grid = {};
            drawGrid();
        }
    });

    // change cell state when mouse is clicked
    canvas.addEventListener('mousedown', function (e) {
        var rect = canvas.getBoundingClientRect();
        let mousex = e.clientX - rect.left;
        let mousey = e.clientY - rect.top;
        let i = Math.floor((mousex - canvas.width / 2) / zoom + x);
        let j = Math.floor((mousey - canvas.height / 2) / zoom + y);
        let cell = grid[hash(i, j)];
        grid[hash(i, j)] = cell == 1 ? 0 : 1;
        drawGrid();
    });
}

// animate
function animate() {
    let newGrid = {};
    for (let i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (let j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            // game of life
            let neighbors = countNeighbors(i, j);
            
            if (neighbors < 2 || neighbors > 3) {
                newGrid[hash(i, j)] = 0;
            } else if (neighbors == 3) {
                newGrid[hash(i, j)] = 1;    
            } else {
                newGrid[hash(i, j)] = grid[hash(i, j)];
            }
        }
    }

    for (let i = Math.floor(x - canvas.width / zoom / 2); i < x + canvas.width / zoom / 2; i++) {
        for (let j = Math.floor(y - canvas.height / zoom / 2); j < y + canvas.height / zoom / 2; j++) {
            grid[hash(i, j)] = newGrid[hash(i, j)];
        }
    }

    // draw grid
    drawGrid();

    // if animation is running, call animate again
    if (isAnimated) {
        step = window.requestAnimationFrame(animate);
    }
}

// count neighbors
function countNeighbors(i, j) {
    let neighbors = -grid[hash(i,j)];
    for (let x = i - 1; x <= i + 1; x++) {
        for (let y = j - 1; y <= j + 1; y++) {
            if (hash(x, y) in grid && grid[hash(x, y)] == 1) {
                neighbors++;
            }
        }
    }
    return neighbors;
}
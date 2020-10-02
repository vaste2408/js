const canv = document.getElementById('gc');
const ctx = canv.getContext('2d');
const score = document.getElementById('score');
const timer = document.getElementById('timer');
const _size = 25; //base size of pixel (scale)
const _08size = Math.floor(_size*0.8); //to make borders of pixels
const _v = 1; //base velocity - pixels per move
const _tail = 5; //base snake length
const _speed = 15; // base moves per second
const _maxApples = 10;

const _apple = { // apple structure
    x: 0,
    y: 0,
    score: 1,
    bonus: 1,
    color: 'red'
}

let speed = _speed; //game speed
let width = height = 0; //game field dimensions
let gs =_size; let tcx = tcy = 0; //scale and borders
let xv = yv = 0; 
let px = py = 0; //snake position
let trail = []; //snake items
let tail = _tail; //snake length

let _score = 0; //apples ate till collision
let _time = 0; //time passed till collision

let _apples = []; //apples on map

//timer flags
let _gameStart = false;
let _timer = false;
let _apple_gen = false;
let _speedCheck = false;

do_timer = () => {
    timer.innerText = 'Time passed: ' + (++_time);
}

generate_apple = () => {
    if (_apples.length > _maxApples - 1)
        return;
    let ap = {..._apple};
    ap.x = Math.floor(Math.random()*tcx);
    ap.y = Math.floor(Math.random()*tcy);
    ap.score = ap.bonus = Math.floor(Math.random() * Math.floor(2)) + 1;
    ap.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    if (_apples.filter(a => a.x == ap.x && a.y == ap.y).length > 0)
        return;
    draw_apple(ap);
    _apples.push(ap);
}

eat = () => {
    _apples.map ((a, i) => {
        if (px == a.x && py == a.y){ //step on apple
            tail += a.bonus;
            _score += a.score;
            _apples.splice(i,1);
        }
    });
}

draw_field = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0,0,Math.floor(width),Math.floor(height));
}

draw_snake = () => {
    ctx.fillStyle = "peru";
    for (let i=0; i<trail.length; i++){
        if (i == trail.length - 1)
            ctx.fillRect((trail[i].x - 0.35)*gs, (trail[i].y - 0.35)*gs, _size * 1.5, _size * 1.5);
        else
            ctx.fillRect(trail[i].x*gs, trail[i].y*gs, _08size, _08size);
        if (trail[i].x == px && trail[i].y == py){ //step on tail
            tail = _tail;
            _score = 0;
            _time = 0;
        }
    }
}

draw_apple = (a) => {
    ctx.fillStyle = a.color;
    ctx.fillRect((a.x + 0.35*(1-a.bonus)) * gs, (a.y + 0.35*(1-a.bonus)) * gs, _08size * a.bonus, _08size * a.bonus);
}

draw_apples = () => {
    _apples.map (a => {
        draw_apple(a);
    });
}

start_game = () => {
    clearInterval(_gameStart);
    _gameStart = setInterval(game, 1000/speed);
}

speed_check = () => {
    _score == 0 ? speed = _speed : speed = speed;
    speed = _speed + (_score / 5);
    start_game();
}

game = () => {
    speed_check();
    px += xv; //movement
    py += yv;
    if (px < 0){ //borders
        px = tcx - _v;
    }
    if (px > tcx - _v){
        px = 0;
    }
    if (py < 0){ //borders
        py = tcy - _v;
    }
    if (py > tcy - _v){
        py = 0;
    }

    draw_field();

    draw_snake();

    trail.push({x:px, y:py});
    while (trail.length > tail){
        trail.shift();
    }

    eat();

    draw_apples();

    score.innerText = _score;
}

document.addEventListener ('DOMContentLoaded', () => {
    window.addEventListener('resize', resizeCanvas, false);
            
    function resizeCanvas() {
        canv.width = window.innerWidth;
        canv.height = window.innerHeight;
        start(); 
    }
    resizeCanvas();

    function start() {
        height = window.getComputedStyle(canv,null).height.replace('px','');
        width = window.getComputedStyle(canv,null).width.replace('px','');
        tcx = Math.floor(width / gs); tcy = Math.floor(height / gs);
        px = Math.floor(width / gs / 2); py = Math.floor(height / gs / 2);
        document.addEventListener('keydown', key => {
            switch (key.keyCode){
                case 37:
                    xv = -1 * _v; yv = 0;
                    break;
                case 38:
                    xv = 0; yv = -1 * _v;
                    break;
                case 39:
                    xv = 1 * _v; yv = 0;
                    break;
                case 40:
                    xv = 0; yv = 1 * _v;
                    break;
            }
            if (!_timer){
                _timer = setInterval(do_timer, 1000);
            } 
            if (!_apple_gen){
                _apple_gen = setInterval(generate_apple, 1000);
            }
        });
        start_game();
        generate_apple();
    }
});
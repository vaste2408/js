const canv = document.getElementById('gc');
const ctx = canv.getContext('2d');
const score = document.getElementById('score');
const timer = document.getElementById('timer');
const _restart = document.getElementById('restart');
const _help = document.getElementById('help');
const _generateColor = () => '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
const _size = 25; //base size of pixel (scale)
const _08size = Math.floor(_size*0.8); //to make borders of pixels
const _v = 1; //base velocity - pixels per move
const _tail = 5; //base snake length
const _speed = 15; // base moves per second
const _maxApples = 10;
const _10secs = 10;

const _apple = { // apple structure
    x: 0,
    y: 0,
    score: 1,
    bonus: 1,
    color: 'red',
    lifetime: 10
}

const _snake = { // snake structure
    x : 0, //snake position
    y: 0,
    color: 'peru', //snake color
    trail: [], //snake items
    tail: _tail, //snake length
    move: false
}
let snake;

let speed = _speed; //game speed
let width = height = 0; //game field dimensions
let _fieldColorL = _generateColor(); //field background 
let _fieldColorR = _generateColor();
let gs =_size; let tcx = tcy = 0; //scale and borders
let xv = yv = 0; 

let _score = 0; //apples ate till collision
let _maxScore = 0;
let _time = 0; //time passed till collision
let _time10 = 0;

let _apples = []; //apples on map

//timer flags
let _gameStart = false;
let _timer = false;
let _apple_gen = false;
let _speedCheck = false;

do_timer = () => {
    if (++_time10 >= _10secs){
        _time10 = 0;
        _fieldColorR = _fieldColorL;
        _fieldColorL = _generateColor();
    }
    timer.innerText = 'Time passed: ' + (++_time);
    _apples.map(a => {
        a.lifetime--;
    });
    destroy_apples();
}

draw_field = () => {
    let grd = ctx.createLinearGradient(0, 0, Math.floor(width), 0);
    grd.addColorStop(0, _fieldColorL);
    grd.addColorStop(1, _fieldColorR);
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,Math.floor(width),Math.floor(height));
}

move_snake = () => {
    snake.x += xv; //movement
    snake.y += yv;
    if (snake.x < 0){ //border crossing
        snake.x = tcx - _v;
    }
    if (snake.x > tcx - _v){
        snake.x = 0;
    }
    if (snake.y < 0){ //border crossing
        snake.y = tcy - _v;
    }
    if (snake.y > tcy - _v){
        snake.y = 0;
    }
}

draw_snake = () => {
    move_snake();

    ctx.fillStyle = snake.color;
    ctx.strokeStyle = 'black';
    for (let i = 0; i < snake.trail.length; i++){
        if (i == snake.trail.length - 1){
            ctx.beginPath();
            ctx.arc((snake.trail[i].x + 0.35) * gs, (snake.trail[i].y + 0.35) * gs, gs, 0, 2 * Math.PI, true);
            //ctx.rect((snake.trail[i].x - 0.35)*gs, (snake.trail[i].y - 0.35)*gs, _size * 1.5, _size * 1.5);
        }
        else{
            ctx.rect(snake.trail[i].x*gs, snake.trail[i].y*gs, _08size, _08size);
        }
        ctx.fill();
        ctx.stroke();
            
        if (snake.trail[i].x == snake.x && snake.trail[i].y == snake.y && snake.move){ //step on tail
            snake.tail = _tail;
            _score = _time = 0;
            set_score();
        }
    }
    snake.trail.push({x:snake.x, y:snake.y});
    while (snake.trail.length > snake.tail){
        snake.trail.shift();
    }
    eat();
}

eat = () => {
    _apples.map ((a, i) => {
        if (snake.x == a.x && snake.y == a.y){ //step on apple
            snake.color = a.color;
            snake.tail += a.bonus;
            _score += a.score;
            _maxScore = _maxScore < _score ? _score : _maxScore;
            _apples.splice(i,1);
            set_score();
        }
    });
}

destroy_apples = () => { //rotten apples disappears
    _apples.map ((a,i) => {
        if (a.lifetime <= 0){
            _apples.splice(i, 1);
        }
    });
}

generate_apple = () => {
    if (_apples.length > _maxApples - 1)
        return;
    let ap = {..._apple};
    ap.x = Math.floor(Math.random()*tcx);
    ap.y = Math.floor(Math.random()*tcy);
    ap.score = ap.bonus = Math.floor(Math.random() * Math.floor(2)) + 1;
    ap.color = _generateColor();
    ap.lifetime = Math.ceil(ap.lifetime / ap.bonus);
    if (_apples.filter(a => a.x == ap.x && a.y == ap.y).length > 0)
        return;
    draw_apple(ap);
    _apples.push(ap);
}

draw_apple = (a) => {
    ctx.beginPath();
    ctx.fillStyle = a.color;
    ctx.arc((a.x + 0.35) * gs, (a.y + 0.35) * gs, gs / 2 * (1 + 0.2 * (a.bonus - 1)), 0, 2 * Math.PI, true);
    //ctx.rect((a.x + 0.35*(1-a.bonus)) * gs, (a.y + 0.35*(1-a.bonus)) * gs, _08size * a.bonus, _08size * a.bonus);
    ctx.fill();
    ctx.stroke();
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

set_score = () => {
    score.innerText = _score;
    score.innerText += ' (max: ' + _maxScore + ')';
}

game = () => {
    draw_field();

    speed_check();

    draw_snake();

    draw_apples();
}

document.addEventListener ('DOMContentLoaded', () => {
    _restart.addEventListener('click', () => {
        start();
    });

    window.addEventListener('resize', resizeCanvas, false);
            
    function resizeCanvas() {
        canv.width = window.innerWidth;
        canv.height = window.innerHeight;
        start(); 
    }
    resizeCanvas();

    function start() {
        xv = yv = _maxScore = _time = _score = _time10 = 0; speed = _speed;
        clearInterval(_timer); clearInterval(_apple_gen); clearInterval(_gameStart);
        _timer = _apple_gen = _gameStart = false;
        _apples = [];
        timer.innerText = 'Time passed: ' + (_time);
        height = window.getComputedStyle(canv,null).height.replace('px','');
        width = window.getComputedStyle(canv,null).width.replace('px','');
        tcx = Math.floor(width / gs); tcy = Math.floor(height / gs);
        snake = {..._snake};
        snake.x = Math.floor(width / gs / 2); snake.y = Math.floor(height / gs / 2);
        document.addEventListener('keydown', key => {
            switch (key.keyCode){
                case 32:
                    start();
                    break;
                case 37: case 38: case 39: case 40:
                    if (key.keyCode == 37){
                        xv = -1 * _v; yv = 0;
                    }
                    if (key.keyCode == 38){
                        xv = 0; yv = -1 * _v;
                    }
                    if (key.keyCode == 39){
                        xv = 1 * _v; yv = 0;
                    }
                    if (key.keyCode == 40){
                        xv = 0; yv = 1 * _v;
                    }
                    snake.move = true;
                    if (!_timer){
                        _timer = setInterval(do_timer, 1000);
                    } 
                    if (!_apple_gen){
                        _apple_gen = setInterval(generate_apple, 1000);
                    }
                    break;
            }
        });
        start_game();
        set_score();
        generate_apple();
    }
});
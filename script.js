const canv = document.getElementById('gc');
const ctx = canv.getContext('2d');
const score = document.getElementById('score');
const timer = document.getElementById('timer');
const _restart = document.getElementById('restart');
const _help = document.getElementById('help');
const _abils_nest = document.getElementById('abils');
const _notif_nest = document.getElementById('notif');
const _fps_nest = document.getElementById('fps');
const _generateColor = () => '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
const _size = 25; //base size of pixel (scale)
const _08size = Math.floor(_size*0.8); //to make borders of pixels
const _v = 1; //base velocity - pixels per move
const _tail = 5; //base snake length
const _speed = 15; // base moves per second
const _maxApples = 10;
const _10secs = 10;
const _nextLevelScore = 20;
const _traceName = 'trace', _bigHeadName = 'bigHead', _invulName = 'invulnerable', _sapierName = 'sapier';
const _abilKeys = [_traceName, _bigHeadName, _invulName, _sapierName]; // keys of abilities
const _abilities = {
    'trace' : { //trace ray from head to border
        name: _traceName,
        color: 'red',
        lifetime: 30,
        descr: 'What happens when snake obtains laser tag? Thats.',
        pseudo: 'Laser tag!'
    } 
    ,'bigHead' : { //collect in radius
        name: _bigHeadName,
        radius: 2,
        lifetime: 30,
        descr: 'Looks like U\'ve got an vortex inside your mouth...',
        pseudo: 'Vortex'
    } 
    ,'invulnerable' : {
        name: _invulName,
        active: 1,
        lifetime: 30,
        descr: 'No pain - no gain! Well, its opposite, thought.',
        pseudo: 'Die hard'
    }
    ,'sapier' : {
        name: _sapierName,
        color: 'red',
        lifetime: 30,
        descr: 'One old metal detector for you. Enjoy.',
        pseudo: 'I see!'
    }
}

const _oddDictionary = {
    good : ['Yuppee!', 'That was nice', 'A good one! Thanx!', 'Something finally usefull'],
    bad: ['Ouch! Don\'t do THAT!', 'That was rough' , 'If I was U I would never do that', 'What? Again? Nooo', 'God, PLEASE, no!'],
    afk: ['Im outta sleep some, let me know if U wanna go']
}
const _events = {
    stepOnTail : 'stepOnTail',
    eatApple : 'eatApple',
    frustrated : 'frustrated',
    restart : 'restart',
    score : 'score',
    time : 'time',
    gotAbility : 'gotAbility',
    lostAbility : 'lostAbility'
}

const _random_exclamation = (tag = 'afk') => {
    return _oddDictionary[tag][Math.floor(Math.random() * _oddDictionary[tag].length)];
}

const _apple = { // apple structure
    x: 0,
    y: 0,
    score: 1,
    bonus: 1,
    color: 'red',
    lifetime: 10,
    grantsAbil: -1,
    bomb: false
}

const _snake = { // snake structure
    x : 0, //snake position
    y: 0,
    color: 'peru', //snake color
    trail: [], //snake items
    tail: _tail, //snake length
    move: false,
    direction: '',
    abils: []
}

let snake;

let speed = _speed; //game speed
let width = height = 0; //game field dimensions
let _fieldColorL = _generateColor(); //field background 
let _fieldColorR = _generateColor();
let gs =_size; let _totalCellX = _totalCellY = 0; //scale and borders
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

const _is_in_area = (a, b, x, y, r) => { //util function to detect if point is in circle area or not
    let dist_points = (a - x) * (a - x) + (b - y) * (b - y);
    r *= r;
    return dist_points < r;
}

const _do_timer = () => {
    if (++_time10 >= _10secs){
        _time10 = 0;
        _fieldColorR = _fieldColorL;
        _fieldColorL = _generateColor();
    }
    timer.innerText = 'Time passed: ' + (++_time);
    _apples.map(a => {
        a.lifetime--;
    });
    _destroy_apples();
}

const _clear_notif = (_msg) => {
    _msg.remove();
}

const _create_notify = (msg) => {
    let _msg = document.createElement('div');
    _msg.classList.add('nest');
    _msg.innerText = msg;
    _notif_nest.appendChild(_msg);
    setTimeout(_clear_notif, 5000, _msg);
}

const _draw_field = () => {
    let grd = ctx.createLinearGradient(0, 0, Math.floor(width), 0);
    grd.addColorStop(0, _fieldColorL);
    grd.addColorStop(1, _fieldColorR);
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,Math.floor(width),Math.floor(height));
}

const _has_ability = (snake, ability) => {
    return (snake.abils.filter(a => a == _abilities[ability]).length != 0)
}

const _grant_ability = (snake, ability_name) => {
    if (!_has_ability(snake, ability_name))
        snake.abils.push(_abilities[ability_name]);
    else{ //has ability - extend lifetime
        snake.abils.map(ab => {
            if (ab.name == ability_name)
                ab.lifetime += _abilities[ability_name].lifetime;
        });
    }
    _draw_abilities(snake);
    _create_notify(_abilities[ability_name].descr);
}

const _grant_all = () => {
    _abilKeys.map(key => {
        _grant_ability(snake, key);
    })
}

const _deny_ability = (snake, ability) => {
    if (_has_ability(snake, ability)){
        let index = snake.abils.indexOf(_abilities[ability]);
        snake.abils.splice(index, 1);
        _draw_abilities(snake);
    }
}

const _draw_abilities = (snake) => {
    _abils_nest.innerHTML = 'Your abilities:';
    snake.abils.map(abil => {
        let _ab = document.createElement('p');
        _ab.innerText = abil.pseudo + ': ' + abil.lifetime + ' secs';
        _abils_nest.appendChild(_ab);
    });
}

const _draw_trace = (snake) =>{
    let _x = (snake.trail[snake.trail.length - 1].x + 0.35) * gs;
    let _y = (snake.trail[snake.trail.length - 1].y + 0.35) * gs;
    ctx.beginPath();
    ctx.moveTo(_x, _y);
    switch (snake.direction){
        case 'up':
            ctx.lineTo(_x, 0);
            break;
        case 'down':
            ctx.lineTo(_x, height);
            break;
        case 'left':
            ctx.lineTo(0, _y);
            break;
        case 'right':
            ctx.lineTo(width, _y);
            break;
    }
    ctx.stroke();
}

const _move_snake = () => {
    snake.x += xv; //movement
    snake.y += yv;
    if (snake.x < 0){ //border crossing
        snake.x = _totalCellX - _v;
    }
    if (snake.x > _totalCellX - _v){
        snake.x = 0;
    }
    if (snake.y < 0){ //border crossing
        snake.y = _totalCellY - _v;
    }
    if (snake.y > _totalCellY - _v){
        snake.y = 0;
    }
}

const _draw_snake = () => {
    _move_snake();

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
        
        if (!_has_ability(snake, _invulName))
            if (snake.trail[i].x == snake.x && snake.trail[i].y == snake.y && snake.move){ //step on tail
                snake.tail = _tail;
                _score = _time = 0;
                _set_score();
                _create_notify(_random_exclamation('bad'));
            }
    }
    snake.trail.push({x:snake.x, y:snake.y});
    while (snake.trail.length > snake.tail){
        snake.trail.shift();
    }
    _eat();
    if (_has_ability(snake, _traceName)){
        _draw_trace(snake);
    }
    
}

const _eat = () => {  //step on apple
    _apples.map ((a, i) => {
        if (_is_in_area(a.x, a.y, snake.x, snake.y, _abilities[_bigHeadName].radius) && _has_ability(snake, _bigHeadName)
        || (snake.x == a.x && snake.y == a.y)){
            _apples.splice(i,1);
            if (a.bomb){
                if (_has_ability(snake, _invulName)){
                    _deny_ability(snake, _invulName);
                }
                else{
                    _create_notify('BOOM!!!!');
                    _init_game();
                }
            }else{
                snake.color = a.color;
                snake.tail += a.bonus;
                _score += a.score;
                _maxScore = _maxScore < _score ? _score : _maxScore;
                _set_score();
                if (a.grantsAbil > -1 && a.grantsAbil < _abilKeys.length)
                    _grant_ability(snake, _abilKeys[a.grantsAbil]);
            }
        }
    });
}

const _destroy_apples = () => { //rotten apples disappears
    _apples.map ((a,i) => {
        if (a.lifetime <= 0) {
            _apples.splice(i, 1);
        }
    });
}

const _generate_apple = () => {
    if (_apples.length > _maxApples - 1)
        return;
    let ap = {..._apple};
    // is it bomb?
    if (_score >= _nextLevelScore*2)
        ap.bomb = (Math.floor(Math.random() * 11) > 9);
    if (ap.bomb && _score >= _nextLevelScore*4){
        //bombs are at 5-10 cells far from snake
        ap.x = snake.x + Math.floor(Math.random()*(13 - (Math.floor(_score / 30) > 8 ? 8 : Math.floor(_score / 30)) + 5));
        ap.y = snake.y + Math.floor(Math.random()*(13 - (Math.floor(_score / 30) > 8 ? 8 : Math.floor(_score / 30)) + 5));
    }
    else{
        ap.x = Math.floor(Math.random()*_totalCellX);
        ap.y = Math.floor(Math.random()*_totalCellY);
    }
    if (_apples.filter(a => a.x == ap.x && a.y == ap.y).length > 0)
        return;
    if (_score >= _nextLevelScore)
        ap.grantsAbil = Math.floor(Math.random() * 31);
    ap.score = ap.bonus = Math.floor(Math.random() * 2) + 1;
    ap.color = _generateColor();
    ap.lifetime = Math.ceil(ap.lifetime / ap.bonus);
    _draw_apple(ap);
    _apples.push(ap);
}

const _generate_snake = () => {
    let snake = {..._snake};
    snake.x = Math.floor(width / gs / 2); snake.y = Math.floor(height / gs / 2);
    snake.abils = []; snake.trail = [];
    return snake;
}

const _draw_apple = (a) => {
    ctx.beginPath();
    ctx.fillStyle = a.color;
    if (_has_ability(snake, _sapierName) && a.bomb){
        ctx.fillStyle = 'red';
        ctx.rect((a.x + 0.35*(1-a.bonus)) * gs, (a.y + 0.35*(1-a.bonus)) * gs, _08size * a.bonus, _08size * a.bonus);
    }
    else
        ctx.arc((a.x + 0.35) * gs, (a.y + 0.35) * gs, gs / 2 * (1 + 0.2 * (a.bonus - 1)), 0, 2 * Math.PI, true);
    ctx.fill();
    ctx.stroke();
}

const _draw_apples = () => {
    _apples.map (a => {
        _draw_apple(a);
    });
}

const _start_game = () => {
    clearInterval(_gameStart);
    _gameStart = setInterval(_game, 1000/speed);
}

const _speed_check = () => {
    _score == 0 ? speed = _speed : speed = speed;
    speed = _speed + (_score / 5);
    _start_game();
}

const _set_score = () => {
    score.innerText = _score;
    score.innerText += ' (max: ' + _maxScore + ')';
}

const _game = () => {
    _draw_field();

    _speed_check();

    _draw_snake();

    _draw_apples();
}

const _init_game = () => {
    _create_notify('Hello there! Lets have some fun swallowing thouse shiny little apples!');
    xv = yv = _time = _score = _time10 = 0; speed = _speed;
    clearInterval(_timer); clearInterval(_apple_gen); clearInterval(_gameStart);
    _timer = _apple_gen = _gameStart = false;
    _apples = [];
    timer.innerText = 'Time passed: ' + (_time);
    _abils_nest.innerText = 'Your abilities: ';
    height = window.getComputedStyle(canv,null).height.replace('px','');
    width = window.getComputedStyle(canv,null).width.replace('px','');
    _totalCellX = Math.floor(width / gs); _totalCellY = Math.floor(height / gs);
    snake = _generate_snake();

    _generate_apple();
    _start_game();
    _set_score();
}

const times = [];
let fps;

const refreshLoop = () => {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    _fps_nest.innerText = fps;
    refreshLoop();
  });
}

refreshLoop();

document.addEventListener ('DOMContentLoaded', () => {
    _restart.addEventListener('click', () => {
        _init_game();
    });

    window.addEventListener('resize', resizeCanvas, false);
            
    function resizeCanvas() {
        canv.width = window.innerWidth;
        canv.height = window.innerHeight;
        start(); 
    }
    resizeCanvas();

    function start() {
        _init_game();
        document.addEventListener('keydown', key => {
            switch (key.keyCode){
                case 32:
                    _init_game();
                    break;
                case 37: case 38: case 39: case 40:
                    if (key.keyCode == 37){
                        xv = -1 * _v; yv = 0;
                        snake.direction = 'left';
                    }
                    if (key.keyCode == 38){
                        xv = 0; yv = -1 * _v;
                        snake.direction = 'up';
                    }
                    if (key.keyCode == 39){
                        xv = 1 * _v; yv = 0;
                        snake.direction = 'right';
                    }
                    if (key.keyCode == 40){
                        xv = 0; yv = 1 * _v;
                        snake.direction = 'down';
                    }
                    snake.move = true;
                    if (!_timer){
                        _timer = setInterval(_do_timer, 1000);
                    } 
                    if (!_apple_gen){
                        _apple_gen = setInterval(_generate_apple, 1000);
                    }
                    break;
            }
        });
    }
});
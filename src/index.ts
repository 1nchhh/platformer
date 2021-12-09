import chalk, { Keys } from 'chalk';
import { EventEmitter } from 'events';
import readline from 'readline';
import ansi from 'ansi-escapes';

const kp = new EventEmitter();
readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name == 'c') process.exit();
    kp.emit('keypress', key);
});

// console based platformer

const { rows: _rows, columns: _columns } = process.stdout;
const rows = _rows - 1;
const columns = _columns - 1;

const block = '█'

interface GamePlayerType {
    pos: {
        x: number;
        y: number
    };
    rawpos: {
        x: number;
        y: number
    };
    momentum: {
        x: number;
        y: number
    };
    fps: number;
    color: string;
    columns: number;
    rows: number;
    move(direction: string): void;
    render(): {
        x: number;
        y: number;
        color: string;
        d: string;
    }
}

interface GameType {
    columns: number;
    rows: number;
    colors: {
        [key: string]: Keys;
    };
    player: GamePlayer;
}

class GamePlayer implements GamePlayerType {
    pos: {
        x: number;
        y: number;
    };
    rawpos: {
        x: number;
        y: number;
    }
    momentum: {
        x: number;
        y: number;
    } = {
            x: 0,
            y: 0
        };
    color: Keys;
    columns: number;
    rows: number;
    fps: number;
    constructor(clr: Keys, columns: number, rows: number, fps: number) {
        this.columns = columns;
        this.rows = rows;
        this.color = clr;
        this.fps = fps;
        this.pos = {
            x: Math.round((columns - 1) / 2),
            y: rows - 1
        }
        this.rawpos = this.pos;

        // implement gravity and momentum
        setInterval(() => {
            this.pos.y++;
        }, 1000 / this.fps);

        setInterval(() => {
            this.rawpos.x += this.momentum.x;
            this.rawpos.y += this.momentum.y;
            let xm = this.momentum.x / 1.3;
            let ym = this.momentum.y / 1.3;
            this.momentum.x = xm > .1 ? xm : 0;
            this.momentum.y = ym > .1 ? ym : 0;
            this.pos.x = Math.round(this.rawpos.x);
            this.pos.y = Math.round(this.rawpos.y);
        }, 1000 / this.fps);
    }
    move(direction: string) {
        if (direction == 'up') {
            this.pos.y--;
        } else if (direction == 'down') {
            this.pos.y++;
        } else if (direction == 'left') {
            this.pos.x--;
        } else if (direction == 'right') {
            this.pos.x++;
        }
        if (this.pos.x < 0) this.pos.x = 0;
        if (this.pos.x > columns) this.pos.x = columns;
        if (this.pos.y < 0) this.pos.y = 0;
        if (this.pos.y > rows - 1) this.pos.y = rows - 1;
    }
    render() {
        return {
            x: this.pos.x,
            y: this.pos.y,
            color: this.color,
            d: chalk[this.color](block)
        }
    }
}

class Game implements GameType {
    columns: number;
    rows: number;
    colors: {
        player: Keys;
        bg: Keys;
    };
    fps: number;
    player: GamePlayer;
    constructor(color: Keys, bgColor: Keys, columns: number, rows: number, fps: number) {
        this.columns = columns - 1;
        this.rows = rows;
        this.fps = fps;
        this.colors = {
            player: color,
            bg: bgColor
        }
        this.player = new GamePlayer(this.colors.player, this.columns, this.rows, this.fps);
        kp.on('keypress', (key) => {
            this.player.move(key.name);
        });
    }
    renderRaw() {
        for (let i = 0; i < this.rows; i++) {
            process.stdout.write(ansi.cursorTo(0, i) + (i == this.player.pos.y ? chalk[this.colors.bg](block).repeat(this.player.pos.x - 1) + chalk[this.colors.player](block).repeat(2) + chalk[this.colors.bg](block).repeat(this.columns - this.player.pos.x - 2) : chalk[this.colors.bg](block).repeat(this.columns)));
        }
    }
    render() {
        setInterval(() => { game.render() }, 1000 / this.fps);
    }
}

const game = new Game('white', 'black', columns, rows, 10);
console.clear();
game.render();
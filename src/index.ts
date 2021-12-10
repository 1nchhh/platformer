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

const { rows, columns } = process.stdout;

const block = '█'

interface GamePlayerType {
    pos: Record<string, number>;
    rawpos: Record<string, number>;
    momentum: {
        x: number;
        y: number;
        startpos: {
            x: number | null;
            y: number | null;
        }
    };
    fps: number;
    color: string;
    columns: number;
    rows: number;
    inc: number;
    move(direction: string): void;
    render(): {
        x: number;
        y: number;
        color: string;
        d: string;
    }
}

interface GameObjectType {
    pos: Record<string, number>;
    color: Keys;
    d: number[][];
}

interface GameType {
    columns: number;
    rows: number;
    colors: {
        [key: string]: Keys;
    };
    inc: number;
    player: GamePlayer;
}

class GamePlayer implements GamePlayerType {
    pos: Record<string, number>;
    rawpos: Record<string, number>
    momentum: {
        x: number;
        y: number;
        startpos: {
            x: number | null;
            y: number | null;
        }
    } = {
            x: 0,
            y: 0,
            startpos: {
                x: null,
                y: null
            }
        };
    color: Keys;
    columns: number;
    rows: number;
    fps: number;
    inc: number;
    constructor(clr: Keys, columns: number, rows: number, fps: number, inc: number, game: GameType) {
        this.columns = columns;
        this.rows = rows;
        this.color = clr;
        this.fps = fps;
        this.pos = {
            x: Math.round((columns - 1) / 2),
            y: rows - 1
        }
        this.inc = inc;
        this.rawpos = this.pos;

        // implement gravity and momentum
        setInterval(() => {
            if (this.pos.x < 0) this.pos.x = 0;
            if (this.pos.x > this.columns) this.pos.x = this.columns;
            if (this.pos.y < 0) this.pos.y = 0;
            if (this.pos.y > this.rows - 1) this.pos.y = this.rows - 1;
            for (const dir of 'xy') {
                // @ts-ignore
                if (!this.momentum[dir]) continue;
                // @ts-ignore
                this.rawpos[dir] += this.momentum[dir];
                // @ts-ignore
                let m = Math.abs(this.momentum[dir]) == this.momentum[dir] ? (this.momentum[dir] * .9) : (this.momentum[dir] / .9);
                if (Math.abs(Math.round(m * 100) / 100) < .01 && dir == 'y') m = -m;
                if (Math.abs(Math.round(m * 100) / 100) === this.inc) m = 0;
                // @ts-ignore
                if (dir == 'y') this.momentum[dir] = this.momentum[dir] > 0 ? m : -m;
                this.pos[dir] = Math.round(this.rawpos[dir]);
                // @ts-ignore
                this.momentum[dir] = m;
                // @ts-ignore
                if (dir == 'y' && this.pos[dir] === this.momentum.startpos[dir]) {
                    // @ts-ignore
                    this.momentum.startpos[dir] = null;
                    // @ts-ignore
                    this.momentum[dir] = 0
                };
                // @ts-ignore
                if (dir == 'x' && (this.pos[dir] === this.momentum.startpos[dir] - this.inc || this.pos[dir] === this.momentum.startpos[dir] + this.inc)) {
                    // @ts-ignore
                    this.momentum.startpos[dir] = null;
                    // @ts-ignore
                    this.momentum[dir] = 0
                }
            }
        }, 100);
    }
    move(direction: string) {
        if (direction == 'up') {
            if (this.momentum.startpos.y !== null) return;
            this.momentum.y -= this.inc;
            this.momentum.startpos.y = this.pos.y;
        } else if (direction == 'left') {
            if (this.momentum.startpos.x !== null) return;
            this.momentum.x -= this.inc;
            this.momentum.startpos.x = this.pos.x;
        } else if (direction == 'right') {
            if (this.momentum.startpos.x !== null) return;
            this.momentum.x += this.inc;
            this.momentum.startpos.x = this.pos.x;
        }
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
    inc: number;
    player: GamePlayer;
    constructor(color: Keys, bgColor: Keys, columns: number, rows: number, fps: number, inc: number) {
        this.columns = columns - 1;
        this.rows = rows;
        this.fps = fps;
        this.inc = inc;
        this.colors = {
            player: color,
            bg: bgColor
        }
        this.player = new GamePlayer(this.colors.player, this.columns, this.rows, this.fps, this.inc, this);
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
        setInterval(() => { game.renderRaw() }, 1000 / this.fps);
    }
}

const game = new Game('white', 'black', columns, rows, 60, 4);
console.clear();
game.render();
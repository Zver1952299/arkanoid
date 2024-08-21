const KEYS = {
    RIGTH: 'ArrowRight',
    LEFT: 'ArrowLeft',
    SPACE: ' '
}

const game = {
    ctx: null,
    platform: null,
    ball: null,
    score: 0,
    blocks: [],
    rows: 4,
    cols: 8,
    width: 640,
    heigth: 360,
    gameOver: false,
    sprites: {
        background: null,
        ball: null,
        platform: null,
        block: null
    },
    init() {
        this.ctx = document.querySelector('#mycanvas').getContext('2d');
        this.setEvents();
        this.setFont();
    },
    setFont() {
        this.ctx.font = "18px Arial";
        this.ctx.fillStyle = "#fff";
    },
    setEvents() {
        window.addEventListener('keydown', e => {
            if (e.key === KEYS.SPACE) {
                this.platform.fire();               
            }            
            if (e.key === KEYS.LEFT || e.key === KEYS.RIGTH) {
                this.platform.start(e.key);
            }
        })

        window.addEventListener('keyup', () => {
            this.platform.stop()
        })
    },
    preload(callback) {
        let loaded = 0;
        const required = Object.keys(this.sprites).length;
        const onImageLoad = () => {
            ++loaded;
            if (loaded >= required) {
                callback()
            }
        }
        
        for (const key in this.sprites) {
            this.sprites[key] = new Image();
            this.sprites[key].src = `img/${key}.png`;
            this.sprites[key].addEventListener('load', onImageLoad)
        }
    },
    create() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.blocks.push({
                    active: true,
                    width: 60,
                    heigth: 20,
                    x: 64 * col + 65,
                    y: 22 * row + 35
                })
            }
        }
    },
    update() {
        this.platform.move();
        this.ball.move();
        this.collideBlocks();
        this.collidePlatform();
        this.ball.collideWorldBounds();
        this.platform.collidePlatformBounds();
    },
    addScore() {
        ++this.score;

        if (this.score >= this.blocks.length) {
            this.end('You win!')
        }
    },
    collideBlocks() {
        for (const block of this.blocks) {
            if(this.ball.collide(block) && block.active) {
                this.ball.bumpBlock(block);
                this.addScore();
            }
        }
    },
    collidePlatform() {
        if (this.ball.collide(this.platform)) {
            this.ball.bumpPlatform(this.platform)
        }
    },
    run() {
        if (!this.gameOver) {
            window.requestAnimationFrame(() => {
                this.update();
                this.render();
                this.run();
            })
        }
    },
    render() {
        this.ctx.clearRect(0, 0, this.width, this.heigth)
        this.ctx.drawImage(this.sprites.background, 0, 0);
        this.ctx.drawImage(this.sprites.ball, this.ball.frame * this.ball.width, 0, this.ball.width, this.ball.heigth, this.ball.x, this.ball.y, this.ball.width, this.ball.heigth);
        this.ctx.drawImage(this.sprites.platform, this.platform.x, this.platform.y);
        this.renderBlocks();
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    },
    renderBlocks() {
        for (const block of this.blocks) {
            if (block.active) {
                this.ctx.drawImage(this.sprites.block, block.x, block.y);
            }
        }
    },
    start() {
        this.init()
        this.preload(() => {
            this.create();
            this.run();
        })
    },
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    },
    end(text) {
        this.gameOver = true;
        alert(text);
        window.location.reload(); 
    }
}

game.ball = {
    speed: 6,
    dy: 0,
    dx: 0,
    x: 320,
    y: 280,
    width: 20,
    heigth: 20,
    frame: 0,
    start() {
        this.dy = -this.speed;
        this.dx = game.random(this.speed, - this.speed);

        setInterval(() => {
            ++this.frame;
            if (this.frame > 3) {
                this.frame = 0;
            }
        }, 100)
    },
    move() {
        if (this.dy) {
            this.y += this.dy;
            this.x += this.dx;
        }
    },
    collide(elem) {
        const x = this.x + this.dx;
        const y = this.y + this.dy;

        if (x < elem.x + elem.width &&
            x + this.width > elem.x &&
            y < elem.y + elem.heigth &&
            y + this.heigth > elem.y) {
                return true
            }

        return false
    },
    bumpBlock(block) {
        this.dy *= -1;
        if (block.active) {
            block.active = false;
        }
    },
    bumpPlatform(platform) {
        if (platform.dx) {
            this.x += platform.dx;
        }

        if (this.dy > 0) {
            this.dy = -this.speed;
            const touchX = this.x + this.width / 2;
            this.dx = this.speed * platform.getTouchOffset(touchX)
        }
    },
    collideWorldBounds() {
        const x = this.x + this.dx;
        const y = this.y + this.dy;

        const ballLeft = x;
        const ballTop = y;
        const ballRigth = ballLeft + this.width;
        const ballBottom = ballTop + this.width;

        const worldLeft = 0;
        const worldTop = 0;
        const worldRigth = game.width;
        const worldBottom = game.heigth;

        if (ballLeft < worldLeft) {
            this.x = 0;
            this.dx = this.speed;
        } else if (ballTop < worldTop) {
            this.y = 0;
            this.dy = this.speed;
        } else if (ballRigth > worldRigth) {
            this.x = worldRigth - this.width;
            this.dx = -this.speed;
        } else if (ballBottom > worldBottom) {
            game.end('Game over!')      
        }
    }
}

game.platform = {
    speed: 9,
    dx: 0,
    x: 280,
    y: 300,
    width: 100,
    heigth: 14,
    ball: game.ball,
    move() {
        if (this.dx) {
            this.x += this.dx;
            if (this.ball) {
                this.ball.x += this.dx;
            }
        }
    },
    fire() {
        if (this.ball) {
            this.ball.start()
            this.ball = null;
        }
    },
    start(direction) {
        if (direction === KEYS.RIGTH) {
            this.dx = this.speed;
        } else if (direction === KEYS.LEFT) {
            this.dx = -this.speed;
        }
    },
    stop() {
        this.dx = 0;
    },
    getTouchOffset(x) {
        const deff = (this.x + this.width) - x;
        const offset = this.width - deff;
        const result = 2 * offset / this.width;
        return result - 1;
    },
    collidePlatformBounds() {
        if (this.x < 0) {
            this.stop();
            this.x = 0;
            if (this.ball) {
                this.ball.dx = 0;
                this.ball.x = this.width / 2 - this.ball.width / 2;
            }
        } else if (this.x > game.width - this.width) {
            this.stop();
            this.x = game.width - this.width;
            if (this.ball) {
                this.ball.dx = 0;
                this.ball.x = game.width - (this.width / 2 + this.ball.width / 2);
            }
        }
    }
}

window.addEventListener('load', () => {
    game.start()
})
// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'assets/fondo.jpg');
    this.load.image('pipe-body', 'assets/tuberia-cuerpo.png');
    this.load.image('pipe-cap', 'assets/tuberia-borde.png');
    this.load.image('game-over-img', 'assets/game-over.png');
    this.load.spritesheet('restart-button', 'assets/boton-restart-sheet.png', { frameWidth: 79, frameHeight: 30 });
    this.load.spritesheet('bird', 'assets/pajaro-anim.png', { frameWidth: 120, frameHeight: 118 });
    this.load.spritesheet('fireball_projectile', 'assets/fireball_projectile_anim.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('death_effect', 'assets/death_effect_anim.png', { frameWidth: 64, frameHeight: 64 });
    this.load.audio('flap_sfx', 'assets/sounds/flap_sound.ogg');
}

function create() {
    this.background = this.add.tileSprite(0, 0, config.width, config.height, 'background').setOrigin(0);
    this.bird = this.physics.add.sprite(100, config.height / 2, 'bird').setDisplaySize(60, 59);
    this.bird.setCollideWorldBounds(true);
    
    this.anims.create({
        key: 'fly',
        frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 2 }),
        frameRate: 10,
        repeat: -1
    });
    this.bird.play('fly');
}

function update() {
    this.background.tilePositionX += 0.5;
}
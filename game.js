
// =============================================
//         CÓDIGO PARA CAMBIAR VISTAS
// =============================================
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');
const playButton = document.getElementById('play-button');
const backButton = document.getElementById('back-button');

const debugToggle = document.getElementById('debug-mode-toggle');
const debugOptionsContainer = document.getElementById('debug-options');
const startScoreInput = document.getElementById('start-score-input');
const startEventSelect = document.getElementById('start-event-select');

let phaserGame;

debugToggle.addEventListener('change', () => {
    debugOptionsContainer.classList.toggle('hidden', !debugToggle.checked);
});

playButton.addEventListener('click', () => {
    document.body.classList.add('game-active');
    lobbyView.style.display = 'none';
    gameView.style.display = 'flex';

    const debugOptions = { startScore: 0, startEvent: 'none' };

    if (debugToggle.checked) {
        debugOptions.startScore = parseInt(startScoreInput.value, 10) || 0;
        debugOptions.startEvent = startEventSelect.value;
    }

    // CORRECCIÓN #2: LÓGICA DE INICIO DEL JUEGO
    if (!phaserGame) {
        // Si el juego no existe, lo creamos por primera vez.
        phaserGame = new Phaser.Game(config);
        phaserGame.events.on('ready', () => {
            // Añadimos la escena y la iniciamos. El 'true' hace que se inicie automáticamente.
            // Esto asegura que la escena se crea y ejecuta UNA SOLA VEZ.
            phaserGame.scene.add('mainScene', MainScene, true, debugOptions);
        });
    } else {
        // Si el juego ya existe (partidas posteriores), simplemente reiniciamos la escena.
        phaserGame.scene.start('mainScene', debugOptions);
    }
});


backButton.addEventListener('click', () => {
    document.body.classList.remove('game-active');
    gameView.style.display = 'none';
    lobbyView.style.display = 'block';
    
    // >>>>>>>>>> CAMBIO REALIZADO AQUÍ <<<<<<<<<<
    // Detenemos la escena del juego para parar la música y los procesos.
    if (phaserGame) {
        phaserGame.scene.stop('mainScene');
    }
});

// =============================================
//         LÓGICA DEL NOMBRE DE USUARIO
// =============================================
const usernameDisplay = document.getElementById('username-display');
const usernameText = document.getElementById('username-text');
const usernameInput = document.getElementById('username-input');
const editUsernameBtn = document.getElementById('edit-username-btn');

function loadUsername() {
    const savedUsername = localStorage.getItem('myGameUsername') || 'Carlossww';
    usernameDisplay.textContent = savedUsername;
    usernameText.textContent = savedUsername;
}
editUsernameBtn.addEventListener('click', () => { usernameText.classList.add('hidden'); usernameInput.classList.remove('hidden'); usernameInput.value = usernameText.textContent; usernameInput.focus(); });
usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const newUsername = usernameInput.value.trim();
        if (newUsername) {
            localStorage.setItem('myGameUsername', newUsername);
            usernameDisplay.textContent = newUsername;
            usernameText.textContent = newUsername;
        }
        usernameInput.classList.add('hidden');
        usernameText.classList.remove('hidden');
    }
});

// =============================================
//         LÓGICA DE PANTALLA COMPLETA
// =============================================
const enterFullscreenBtn = document.getElementById('enter-fullscreen');
const exitFullscreenBtn = document.getElementById('exit-fullscreen');
const gameContainer = document.documentElement;
enterFullscreenBtn.addEventListener('click', () => { if (gameContainer.requestFullscreen) { gameContainer.requestFullscreen(); } else if (gameContainer.mozRequestFullScreen) { gameContainer.mozRequestFullScreen(); } else if (gameContainer.webkitRequestFullscreen) { gameContainer.webkitRequestFullscreen(); } else if (gameContainer.msRequestFullscreen) { gameContainer.msRequestFullscreen(); } });
exitFullscreenBtn.addEventListener('click', () => { if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); } else if (document.msExitFullscreen) { document.msExitFullscreen(); } });
document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement) { enterFullscreenBtn.style.display = 'none'; exitFullscreenBtn.style.display = 'block'; } else { enterFullscreenBtn.style.display = 'block'; exitFullscreenBtn.style.display = 'none'; } });
document.addEventListener('DOMContentLoaded', () => { loadUsername(); });

// =============================================
//         CÓDIGO DEL JUEGO CON PHASER
// =============================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'mainScene' });
        this.GRAVITY_STRENGTH = 900;
        this.FLAP_VELOCITY = -330;
        this.INITIAL_PIPE_SPEED = -200;
        this.MAX_PIPE_SPEED = -350;
        this.INITIAL_PIPE_GAP = 140;
        this.MIN_PIPE_GAP = 120;
        this.PIPE_VERTICAL_MOVEMENT = 80;
        this.INITIAL_TWEEN_DURATION = 3000;
        this.MIN_TWEEN_DURATION = 1400;
        this.INITIAL_WALL_AMPLITUDE = 50;
        this.WALL_AMPLITUDE_INCREMENT = 20;
        this.MAX_WALL_AMPLITUDE = 100;
    }

    init(data) {
        this.startOptions = data || {};
    }

    preload() {
        this.load.image('background', 'assets/fondo.jpg');
        this.load.image('pipe-body', 'assets/tuberia-cuerpo.png');
        this.load.image('pipe-cap', 'assets/tuberia-borde.png');
        this.load.image('game-over-img', 'assets/game-over.png');
        this.load.spritesheet('restart-button', 'assets/boton-restart-sheet.png', { frameWidth: 79, frameHeight: 30 });
        
        // ==============================================================================
        // >>>>>>>>>> CORRECCIÓN APLICADA AQUÍ <<<<<<<<<<
        // Se cambiaron las dimensiones para que coincidan con la imagen optimizada.
        this.load.spritesheet('bird', 'assets/pajaro-anim.png', { frameWidth: 90, frameHeight: 63 });
        // ==============================================================================
        
        this.load.spritesheet('fireball_projectile', 'assets/fireball_projectile_anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('death_effect', 'assets/death_effect_anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.audio('flap_sfx', 'assets/sounds/flap_sound.ogg');

        // >>>>>>>>>> CAMBIO REALIZADO AQUÍ <<<<<<<<<<
        // Se carga la música de fondo.
        this.load.audio('background_music', 'assets/musica-fondo.OGG');
    }

    create() {
        this.isFirstWallCleared = false;
        this.isWaitingForArrowTarget = false;
        this.arrowTargetPipe = null;
        if (this.guideArrow) { this.guideArrow.destroy(); this.guideArrow = null; }

        this.cameras.main.resetFX();
        this.cameras.main.scrollX = 0; this.cameras.main.scrollY = 0; this.cameras.main.zoom = 1; this.cameras.main.rotation = 0;
        
        this.gameStarted = false; this.gameOver = false;
        this.isWallEventActive = false; this.isProjectileEventActive = false;
        this.fireballFromLeftNext = false; this.isRotated = false;
        this.projectileEventCount = 0;
        this.score = 0;
        this.isImmortal = false;

        this.currentPipeSpeed = this.INITIAL_PIPE_SPEED;
        this.currentPipeGap = this.INITIAL_PIPE_GAP;
        this.currentTweenDuration = this.INITIAL_TWEEN_DURATION;
        this.currentWallAmplitude = this.INITIAL_WALL_AMPLITUDE;
        this.nextWallScore = 30;
        this.nextProjectileScore = 10;
        
        const { width, height } = this.cameras.main;

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background').setOrigin(0.5).setScrollFactor(0).setDepth(-1);
        this.background.tileScaleX = height / this.textures.get('background').getSourceImage().height;
        this.background.tileScaleY = this.background.tileScaleX;

        this.pipes = this.physics.add.group();
        this.fireballs = this.physics.add.group();
        this.bird = this.physics.add.sprite(100, 300, 'bird');
        
        // >>>>>>>>>> CAMBIO REALIZADO AQUÍ <<<<<<<<<<
        // Se añade y reproduce la música de fondo en bucle.
        if (!this.sound.get('background_music') || !this.sound.get('background_music').isPlaying) {
            this.sound.play('background_music', { loop: true, volume: 0.4 });
        }
        
        this.anims.create({ key: 'flap', frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'burn', frames: this.anims.generateFrameNumbers('fireball_projectile', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'puff', frames: this.anims.generateFrameNumbers('death_effect', { start: 0, end: 11 }), frameRate: 24, repeat: 0 });
        
        // ==============================================================================
        // >>>>>>>>>> CORRECCIÓN APLICADA AQUÍ <<<<<<<<<<
        // Ajustado el setDisplaySize a 60x42 para mantener la proporción (90/63).
        this.bird.setFrame(0).setDisplaySize(60, 42).body.setSize(40, 30);
        // ==============================================================================

        this.bird.setCollideWorldBounds(true).body.onWorldBounds = true;
        this.bird.body.setAllowGravity(false);
        
        this.getReadyText = this.add.text(width / 2, height / 3, '¡Prepárate!', { fontSize: '48px', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setScrollFactor(0);
        this.birdFloat = this.tweens.add({ targets: this.bird, y: 310, ease: 'Sine.easeInOut', duration: 400, yoyo: true, repeat: -1 });
        
        this.physics.world.on('worldbounds', (body) => { if (body.gameObject === this.bird) this.hitPipe(); });
        this.pipeCollider = this.physics.add.collider(this.bird, this.pipes, this.hitPipe, null, this);
        this.fireballCollider = this.physics.add.collider(this.bird, this.fireballs, this.hitPipe, null, this);
        
        this.input.on('pointerdown', () => this.flap());
        this.input.keyboard.on('keydown-SPACE', () => this.flap());
        
        this.scoreText = this.add.text(width / 2, 50, '', { fontSize: '48px', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0).setDepth(10).setScrollFactor(0);
        this.gameOverContainer = this.createGameOverScreen();
        
        const textStyle = { fontSize: '16px', fill: '#ffffff', backgroundColor: '#00000080', padding: { x: 5, y: 3 } };
        this.immortalText = this.add.text(10, 10, 'Inmortal: OFF (I)', textStyle).setScrollFactor(0).setDepth(100);
        this.debugText = this.add.text(10, 30, 'Debug: OFF (D)', textStyle).setScrollFactor(0).setDepth(100);

        this.input.keyboard.on('keydown-I', () => { this.isImmortal = !this.isImmortal; this.immortalText.setText(`Inmortal: ${this.isImmortal ? 'ON' : 'OFF'} (I)`).setColor(this.isImmortal ? '#ff0000' : '#ffffff'); this.bird.setAlpha(this.isImmortal ? 0.5 : 1.0); this.pipeCollider.active = !this.isImmortal; this.fireballCollider.active = !this.isImmortal; this.bird.setCollideWorldBounds(!this.isImmortal); });
        this.input.keyboard.on('keydown-D', () => { this.physics.world.debugGraphic.setVisible(!this.physics.world.debugGraphic.visible); this.physics.world.drawDebug = this.physics.world.debugGraphic.visible; this.debugText.setText(`Debug: ${this.physics.world.drawDebug ? 'ON' : 'OFF'} (D)`).setColor(this.physics.world.drawDebug ? '#ff00ff' : '#ffffff'); });

        this.scale.on('resize', this.resizeAllElements, this);
        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.setVisible(false);

        this.applyDebugOptions();
    }

    startGame() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.bird.body.setAllowGravity(true).setGravityY(this.GRAVITY_STRENGTH);
        if (this.birdFloat) this.birdFloat.stop();
        if (this.getReadyText) this.getReadyText.destroy();
        this.scoreText.setAlpha(1).setText(this.score);
        this.bird.anims.play('flap', true);
        this.pipeTimer = this.time.addEvent({ delay: 1500, callback: this.addPipeRow, callbackScope: this, loop: true });
    }

    applyDebugOptions() {
        if (!this.startOptions || Object.keys(this.startOptions).length === 0) return;
        this.score = this.startOptions.startScore || this.score;
        const event = this.startOptions.startEvent;
        if (event !== 'none') { this.startGame(); }
        switch(event) {
            case 'projectile': this.score = Math.max(this.score, 10); this.nextProjectileScore = this.score; this.updateScoreAndDifficulty(); break;
            case 'wall': this.score = Math.max(this.score, 30); this.nextWallScore = this.score; this.updateScoreAndDifficulty(); break;
            case 'zoom':
                this.score = Math.max(this.score, 31);
                this.cameras.main.startFollow(this.bird, true, 0.1, 0.1);
                this.cameras.main.zoom = 1.3;
                this.setupFirstArrowGuide();
                break;
        }
        this.scoreText.setText(this.score);
    }
    
    flap() {
        if (this.gameOver) return;
        this.sound.play('flap_sfx');
        if (!this.gameStarted) { this.startGame(); }
        this.bird.setVelocityY(this.FLAP_VELOCITY);
        this.bird.setAngle(-30);
    }

    update() {
        if (this.gameOver || !this.gameStarted) return;
        this.background.tilePositionX += 0.5;
        if (this.bird.body.velocity.y < 0) { this.bird.angle = Phaser.Math.Clamp(this.bird.angle - 5, -30, 90); } else if (this.bird.angle < 90) { this.bird.angle += 2.5; }
        
        if (this.guideArrow) {
            this.guideArrow.setPosition(this.bird.x + 40, this.bird.y);
            
            if (this.arrowTargetPipe) {
                const distance = this.arrowTargetPipe.x - this.bird.x;
                if (!this.arrowTargetPipe.active || distance < 250) {
                    this.guideArrow.destroy();
                    this.guideArrow = null;
                    this.arrowTargetPipe = null;
                } else {
                    const targetY = this.arrowTargetPipe.y + (this.currentPipeGap / 2);
                    const angle = Phaser.Math.Angle.Between(this.guideArrow.x, this.guideArrow.y, this.arrowTargetPipe.x, targetY);
                    this.guideArrow.setRotation(angle);
                }
            }
        }
        
        this.fireballs.getChildren().forEach(fireball => { if (fireball.x < this.cameras.main.scrollX - 100 || fireball.x > this.cameras.main.scrollX + this.cameras.main.width + 100) { fireball.destroy(); } });
    }

    addPipeRow() {
        const { width, height } = this.cameras.main;
        const pipeWidth = 90;
        const spawnX = width + this.cameras.main.scrollX;
        const gap = this.currentPipeGap;
        const pipeY = Phaser.Math.Between(80 + (gap / 2), height - 80 - (gap / 2));
        const isMover = this.score >= 10 && Phaser.Math.Between(0, 1) === 1;
        
        const newPipePair = this.createPipePair(spawnX, pipeY, gap, pipeWidth, isMover);

        if (this.isWaitingForArrowTarget) {
            this.arrowTargetPipe = newPipePair.upperCap;
            this.isWaitingForArrowTarget = false;
        }

        const scoreZone = this.add.zone(spawnX + (pipeWidth / 2), 0, 5, height).setOrigin(0, 0);
        this.physics.world.enable(scoreZone);
        scoreZone.body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
        this.physics.add.overlap(this.bird, scoreZone, () => {
            scoreZone.destroy(); this.score++; this.scoreText.setText(this.score); this.updateScoreAndDifficulty();
        });
    }
    
    createPipePair(x, y, gap, width, isMover) {
        const capHeight = 30;
        const bodyWidth = 88;
    
        const upperBody = this.pipes.create(x, y - gap / 2 - capHeight, 'pipe-body').setOrigin(0, 1);
        const upperCap = this.pipes.create(x - (width - bodyWidth) / 2, y - gap / 2, 'pipe-cap').setOrigin(0, 1);
        const lowerBody = this.pipes.create(x, y + gap / 2 + capHeight, 'pipe-body').setOrigin(0, 0);
        const lowerCap = this.pipes.create(x - (width - bodyWidth) / 2, y + gap / 2, 'pipe-cap').setOrigin(0, 0);
        
        const setupPart = (part, isBody, isUpper) => {
            part.setImmovable(true).body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
            if (isBody) {
                let height = isUpper ? part.y : this.cameras.main.height - part.y;
                part.setDisplaySize(bodyWidth, height + this.cameras.main.height);
            } else {
                part.setDisplaySize(width, capHeight);
            }
            if (isUpper) {
                part.setFlipY(true);
            }
        };

        setupPart(upperBody, true, true);
        setupPart(upperCap, false, true);
        setupPart(lowerBody, true, false);
        setupPart(lowerCap, false, false);

        if (isMover) {
            const movingParts = [upperBody, upperCap, lowerBody, lowerCap];
            this.tweens.add({
                targets: movingParts, y: `+=${Phaser.Math.RND.pick([-1, 1]) * this.PIPE_VERTICAL_MOVEMENT}`,
                duration: this.currentTweenDuration, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
            });
        }
        return { upperCap, lowerCap };
    }


    updateScoreAndDifficulty() {
        if (this.isWallEventActive || this.isProjectileEventActive) return;
        if (this.score >= this.nextProjectileScore) { this.nextProjectileScore += 10; this.startProjectileEvent(); return; }
        if (this.score >= this.nextWallScore) { this.nextWallScore += 30; this.isWallEventActive = true; this.generatePipeWall(); return; }
        if (this.currentPipeGap > this.MIN_PIPE_GAP) this.currentPipeGap = Math.max(this.MIN_PIPE_GAP, this.INITIAL_PIPE_GAP - Math.floor(this.score / 5) * 3);
        if (this.currentTweenDuration > this.MIN_TWEEN_DURATION) this.currentTweenDuration = Math.max(this.MIN_TWEEN_DURATION, this.INITIAL_TWEEN_DURATION - this.score * 40);
    }

    startProjectileEvent() {
        this.isProjectileEventActive = true; this.pipeTimer.paused = true; this.projectileEventCount++;
        this.cameras.main.stopFollow();
        this.tweens.add({ targets: this.cameras.main, zoom: 1, scrollY: 0, duration: 500, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.cameras.main, scrollX: this.bird.x - this.cameras.main.width / 2, duration: 800, ease: 'Power2' });
        const startTheFireballs = () => {
            const eventDuration = 10000; const fireballInterval = 550; const fireballSpeed = 320;
            const launchFireball = () => {
                if (this.gameOver) return;
                const birdY = this.bird.y;
                const createFireball = (fromLeft, forcedY) => {
                    let spawnY = forcedY !== undefined ? forcedY : Phaser.Math.Between(birdY - 100, birdY + 100);
                    spawnY = Phaser.Math.Clamp(spawnY, 50, this.cameras.main.height - 50);
                    const spawnX = fromLeft ? this.cameras.main.scrollX - 50 : this.cameras.main.scrollX + this.cameras.main.width + 50;
                    const velocityX = fromLeft ? fireballSpeed : -fireballSpeed;
                    const fireball = this.fireballs.create(spawnX, spawnY, 'fireball_projectile');
                    fireball.body.setAllowGravity(false).setVelocityX(velocityX);
                    fireball.setDisplaySize(80, 80).body.setCircle(22);
                    fireball.anims.play('burn', true).setFlipX(!fromLeft);
                };
                if (this.projectileEventCount <= 2) { createFireball(this.fireballFromLeftNext); } else {
                    const centerPoint = Phaser.Math.Between(birdY - 50, birdY + 50);
                    createFireball(true, centerPoint - (185 / 2));
                    createFireball(false, centerPoint + (185 / 2));
                }
            };
            const fireballTimer = this.time.addEvent({ delay: fireballInterval, callback: launchFireball, loop: true });
            this.time.delayedCall(eventDuration, () => {
                fireballTimer.remove();
                this.time.delayedCall(2000, () => {
                    if (this.gameOver) return;
                    this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 800, ease: 'Power2',
                        onComplete: () => {
                            if (this.gameOver) return;
                            if (this.projectileEventCount <= 2) { this.fireballFromLeftNext = !this.fireballFromLeftNext; }
                            this.isProjectileEventActive = false; this.rotateViewAfterEvent(); this.pipeTimer.paused = false;
                            this.score++; this.scoreText.setText(this.score); this.updateScoreAndDifficulty();
                        }
                    });
                });
            });
        };
        const pipeCheckTimer = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (this.pipes.getChildren().every(p => p.x < this.cameras.main.scrollX)) { pipeCheckTimer.remove(); startTheFireballs(); } } });
    }

    rotateViewAfterEvent() {
        this.isRotated = !this.isRotated; const targetRotation = this.isRotated ? Math.PI : 0;
        this.tweens.add({ targets: this.cameras.main, rotation: targetRotation, duration: 600, ease: 'Sine.easeInOut' });
    }

    generatePipeWall() {
        this.pipeTimer.paused = true;
        const startTheWall = () => {
            const wallPipeCount = 15; const pipeWidth = 90; const gap = 140;
            const centerY = this.cameras.main.height / 2; const direction = Phaser.Math.RND.pick([-1, 1]);
            for (let i = 0; i < wallPipeCount; i++) {
                this.time.delayedCall(i * 150, () => {
                    if (this.gameOver) return;
                    const spawnX = this.cameras.main.width + this.cameras.main.scrollX;
                    const progress = i / (wallPipeCount - 1);
                    const easedValue = Phaser.Math.Easing.Sine.InOut(progress);
                    const offset = (-this.currentWallAmplitude + (easedValue * this.currentWallAmplitude * 2)) * direction;
                    this.createPipePair(spawnX, centerY + offset, gap, pipeWidth, false);
                });
            }
            this.time.delayedCall(wallPipeCount * 150 + 1000, () => {
                if (this.gameOver) return;
                this.currentWallAmplitude = Math.min(this.MAX_WALL_AMPLITUDE, this.currentWallAmplitude + this.WALL_AMPLITUDE_INCREMENT);
                const scoreZone = this.add.zone(this.cameras.main.width + this.cameras.main.scrollX + 200, 0, 5, this.cameras.main.height).setOrigin(0, 0);
                this.physics.world.enable(scoreZone);
                scoreZone.body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
                this.physics.add.overlap(this.bird, scoreZone, () => {
                    scoreZone.destroy(); this.score++; this.scoreText.setText(this.score);
                    this.isWallEventActive = false; this.nextProjectileScore = this.score + 10;
                    this.cameras.main.startFollow(this.bird, true, 0.1, 0.1);
                    this.tweens.add({ targets: this.cameras.main, zoom: 1.3, duration: 500, ease: 'Sine.easeInOut' });
                    if (!this.isFirstWallCleared) { this.setupFirstArrowGuide(); }
                    this.time.delayedCall(1500, () => { if (this.gameOver) return; this.pipeTimer.paused = false; this.updateScoreAndDifficulty(); });
                });
            });
        };
        const pipeCheckTimer = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (this.pipes.getChildren().every(p => p.x < this.cameras.main.scrollX)) { pipeCheckTimer.remove(); startTheWall(); } } });
    }
    
    setupFirstArrowGuide() {
        this.isFirstWallCleared = true;
        this.isWaitingForArrowTarget = true;
        this.guideArrow = this.add.graphics({ lineStyle: { width: 2, color: 0x000000 }, fillStyle: { color: 0x00ff00 } });
        this.guideArrow.fillTriangle(0, -8, 20, 0, 0, 8);
        this.guideArrow.setDepth(200).setVisible(true).setRotation(0);
    }

    hitPipe() {
        if (this.gameOver) return; 
        this.gameOver = true;
        this.time.removeAllEvents();
        this.bird.setVisible(false);
        const deathSprite = this.add.sprite(this.bird.x, this.bird.y, 'death_effect').setDisplaySize(60, 59).play('puff');
        deathSprite.on('animationcomplete', () => deathSprite.destroy());
        this.bird.anims.stop();
        if (!this.isImmortal) { 
            const scores = JSON.parse(localStorage.getItem('myGameScores')) || []; 
            scores.push(this.score); 
            localStorage.setItem('myGameScores', JSON.stringify(scores));
        }
        this.physics.pause();
        if (this.guideArrow) { this.guideArrow.destroy(); this.guideArrow = null; }
        this.arrowTargetPipe = null;

        this.cameras.main.flash(250, 255, 255, 255); 

        // CORRECCIÓN #1: RESETEAR LA CÁMARA ANTES DE MOSTRAR LA UI
        this.cameras.main.stopFollow();
        // Creamos una transición suave para que la cámara vuelva a su posición original.
        this.tweens.add({
            targets: this.cameras.main,
            zoom: 1,
            scrollX: 0,
            scrollY: 0,
            rotation: 0,
            duration: 250, // Duración de la transición en ms
            ease: 'Sine.easeInOut',
            onComplete: () => {
                // Solo cuando la cámara ha vuelto a su estado normal, mostramos la pantalla de Game Over.
                // Esto asegura que las coordenadas del clic serán correctas.
                this.showGameOverScreen();
            }
        });
    }
    
    createGameOverScreen() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(width / 2, height / 2).setAlpha(0).setDepth(100).setScrollFactor(0);
        const gameOverImage = this.add.image(0, -60, 'game-over-img').setOrigin(0.5);
        const scoreBoard = this.add.text(0, 20, '', { fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        const restartButton = this.add.sprite(0, 90, 'restart-button').setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        restartButton.on('pointerover', () => restartButton.setFrame(1))
                     .on('pointerout', () => restartButton.setFrame(0))
                     .on('pointerdown', () => {
                         restartButton.setFrame(2);
                         this.time.delayedCall(100, () => this.scene.start('mainScene', this.startOptions));
                     });

        container.add([gameOverImage, scoreBoard, restartButton]); 
        return container;
    }

    showGameOverScreen() {
        this.gameOverContainer.getAt(1).setText(`Puntuación: ${this.score}`);
        this.add.tween({ targets: this.gameOverContainer, alpha: 1, duration: 300, ease: 'Power2' });
    }

    resizeAllElements(gameSize) {
        const { width, height } = gameSize;
        this.background.setPosition(width / 2, height / 2).setSize(width, height);
        this.background.tileScaleX = height / this.textures.get('background').getSourceImage().height;
        this.background.tileScaleY = this.background.tileScaleX;
        if (this.scoreText) this.scoreText.setX(width / 2);
        if (this.gameOverContainer) this.gameOverContainer.setPosition(width / 2, height / 2);
        if(this.getReadyText) this.getReadyText.setPosition(width / 2, height / 3);
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 400,
        height: 600,
    },
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 }, 
            debug: true 
        }
    },
    // CORRECCIÓN #2: No definimos la escena aquí para evitar que se inicie automáticamente.
    // La añadiremos manualmente en el evento 'click' del botón de jugar.
    scene: null
};

// Se mantiene la función startProjectileEvent sin cambios
MainScene.prototype.startProjectileEvent = function() {
    this.isProjectileEventActive = true; this.pipeTimer.paused = true; this.projectileEventCount++;
    this.cameras.main.stopFollow();
    this.tweens.add({ targets: this.cameras.main, zoom: 1, scrollY: 0, duration: 500, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.cameras.main, scrollX: this.bird.x - this.cameras.main.width / 2, duration: 800, ease: 'Power2' });
    const startTheFireballs = () => {
        const eventDuration = 10000; const fireballInterval = 550; const fireballSpeed = 320;
        const launchFireball = () => {
            if (this.gameOver) return;
            const birdY = this.bird.y;
            const createFireball = (fromLeft, forcedY) => {
                let spawnY = forcedY !== undefined ? forcedY : Phaser.Math.Between(birdY - 100, birdY + 100);
                spawnY = Phaser.Math.Clamp(spawnY, 50, this.cameras.main.height - 50);
                const spawnX = fromLeft ? this.cameras.main.scrollX - 50 : this.cameras.main.scrollX + this.cameras.main.width + 50;
                const velocityX = fromLeft ? fireballSpeed : -fireballSpeed;
                const fireball = this.fireballs.create(spawnX, spawnY, 'fireball_projectile');
                fireball.body.setAllowGravity(false).setVelocityX(velocityX);
                fireball.setDisplaySize(80, 80).body.setCircle(22);
                fireball.anims.play('burn', true).setFlipX(!fromLeft);
            };
            if (this.projectileEventCount <= 2) { createFireball(this.fireballFromLeftNext); } else {
                const centerPoint = Phaser.Math.Between(birdY - 50, birdY + 50);
                createFireball(true, centerPoint - (185 / 2));
                createFireball(false, centerPoint + (185 / 2));
            }
        };
        const fireballTimer = this.time.addEvent({ delay: fireballInterval, callback: launchFireball, loop: true });
        this.time.delayedCall(eventDuration, () => {
            fireballTimer.remove();
            this.time.delayedCall(2000, () => {
                if (this.gameOver) return;
                this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 800, ease: 'Power2',
                    onComplete: () => {
                        if (this.gameOver) return;
                        if (this.projectileEventCount <= 2) { this.fireballFromLeftNext = !this.fireballFromLeftNext; }
                        this.isProjectileEventActive = false; this.rotateViewAfterEvent(); this.pipeTimer.paused = false;
                        this.score++; this.scoreText.setText(this.score); this.updateScoreAndDifficulty();
                    }
                });
            });
        });
    };
    const pipeCheckTimer = this.time.addEvent({ delay: 100, loop: true, callback: () => { if (this.pipes.getChildren().every(p => p.x < this.cameras.main.scrollX)) { pipeCheckTimer.remove(); startTheFireballs(); } } });
};
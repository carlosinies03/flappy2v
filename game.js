// =============================================
//         CÓDIGO PARA CAMBIAR VISTAS
// =============================================
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');
const playButton = document.getElementById('play-button');
const backButton = document.getElementById('back-button');

let phaserGame;

playButton.addEventListener('click', () => {
    document.body.classList.add('game-active');
    lobbyView.style.display = 'none';
    gameView.style.display = 'flex';

    if (!phaserGame) {
        phaserGame = new Phaser.Game(config);
    } else {
        phaserGame.scene.getScene('mainScene').scene.restart();
    }
});

backButton.addEventListener('click', () => {
    document.body.classList.remove('game-active');
    gameView.style.display = 'none';
    lobbyView.style.display = 'block';
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

editUsernameBtn.addEventListener('click', () => {
    usernameText.classList.add('hidden');
    usernameInput.classList.remove('hidden');
    usernameInput.value = usernameText.textContent;
    usernameInput.focus();
});

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

enterFullscreenBtn.addEventListener('click', () => {
    if (gameContainer.requestFullscreen) {
        gameContainer.requestFullscreen();
    } else if (gameContainer.mozRequestFullScreen) { /* Firefox */
        gameContainer.mozRequestFullScreen();
    } else if (gameContainer.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        gameContainer.webkitRequestFullscreen();
    } else if (gameContainer.msRequestFullscreen) { /* IE/Edge */
        gameContainer.msRequestFullscreen();
    }
});

exitFullscreenBtn.addEventListener('click', () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        enterFullscreenBtn.style.display = 'none';
        exitFullscreenBtn.style.display = 'block';
    } else {
        enterFullscreenBtn.style.display = 'block';
        exitFullscreenBtn.style.display = 'none';
    }
});


// Llamadas iniciales al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadUsername();
});

// =============================================
//         CÓDIGO DEL JUEGO CON PHASER
// =============================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'mainScene' });
        this.GRAVITY_STRENGTH = 900;
        this.FLAP_VELOCITY = -330;
        this.INITIAL_PIPE_SPEED = -200;
        this.SPEED_INCREMENT = -20;
        this.MAX_PIPE_SPEED = -350;
        this.INITIAL_PIPE_GAP = 140;
        this.MIN_PIPE_GAP = 120;
        this.PIPE_VERTICAL_MOVEMENT = 80;
        this.INITIAL_TWEEN_DURATION = 3000;
        this.MIN_TWEEN_DURATION = 1400;
        this.PIPE_HORIZONTAL_OFFSET = 40;
        this.INITIAL_WALL_AMPLITUDE = 50;
        this.WALL_AMPLITUDE_INCREMENT = 20;
        this.MAX_WALL_AMPLITUDE = 100;
        this.bird = null;
        this.pipes = null;
        this.fireballs = null;
        this.background = null;
        this.score = 0;
        this.scoreText = null;
        this.gameStarted = false;
        this.gameOver = false;
        this.pipeTimer = null;
        this.isWallEventActive = false;
        this.isProjectileEventActive = false;
        this.fireballFromLeftNext = false;
        this.currentPipeSpeed = this.INITIAL_PIPE_SPEED;
        this.currentPipeGap = this.INITIAL_PIPE_GAP;
        this.currentTweenDuration = this.INITIAL_TWEEN_DURATION;
        this.currentWallAmplitude = this.INITIAL_WALL_AMPLITUDE;
        this.nextWallScore = 30;
        this.nextProjectileScore = 10;
        this.isRotated = false;
        this.projectileEventCount = 0;
        this.isImmortal = false;
        this.immortalText = null;
        this.pipeCollider = null;
        this.fireballCollider = null;

        // AÑADIDO: Propiedades para la flecha de guía y depuración
        this.guideArrow = null;
        this.isFirstWallCleared = false;
        this.isArrowGuideActive = false;
        this.debugText = null;
    }

    preload() {
        this.load.image('background', 'assets/fondo.jpg');
        this.load.image('pipe-body', 'assets/tuberia-cuerpo.png');
        this.load.image('pipe-cap', 'assets/tuberia-borde.png');
        this.load.image('game-over-img', 'assets/game-over.png');
        this.load.spritesheet('restart-button', 'assets/boton-restart-sheet.png', { frameWidth: 79, frameHeight: 30 });
        this.load.spritesheet('bird', 'assets/pajaro-anim.png', { frameWidth: 2299, frameHeight: 1620 });
        this.load.spritesheet('fireball_projectile', 'assets/fireball_projectile_anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('death_effect', 'assets/death_effect_anim.png', { frameWidth: 64, frameHeight: 64 });
        this.load.audio('flap_sfx', 'assets/sounds/flap_sound.ogg');
    }

    create() {
        const { width, height } = this.cameras.main;

        // AÑADIDO: Reinicializar flags de guía al crear la escena
        this.isFirstWallCleared = false;
        this.isArrowGuideActive = false;
        if (this.guideArrow) this.guideArrow.destroy();
        
        if (!this.textures.exists('fireball_projectile')) {
            this.add.text(width / 2, height / 2, "ERROR...", { color: '#ff0000' }).setOrigin(0.5);
            return;
        }
        this.cameras.main.scrollX = 0; this.cameras.main.scrollY = 0; this.cameras.main.zoom = 1; this.cameras.main.rotation = 0;
        this.gameStarted = false; this.gameOver = false; this.isWallEventActive = false; this.isProjectileEventActive = false;
        this.fireballFromLeftNext = false; this.isRotated = false; this.projectileEventCount = 0;
        this.currentPipeSpeed = this.INITIAL_PIPE_SPEED; this.currentPipeGap = this.INITIAL_PIPE_GAP;
        this.currentTweenDuration = this.INITIAL_TWEEN_DURATION; this.currentWallAmplitude = this.INITIAL_WALL_AMPLITUDE;
        this.nextWallScore = 30; this.nextProjectileScore = 10;

        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background').setOrigin(0.5).setScrollFactor(0).setDepth(-1);
        this.background.tileScaleX = height / this.textures.get('background').getSourceImage().height;
        this.background.tileScaleY = this.background.tileScaleX;

        this.pipes = this.physics.add.group(); this.fireballs = this.physics.add.group();
        this.bird = this.physics.add.sprite(100, 300, 'bird');
        this.anims.create({ key: 'flap', frames: this.anims.generateFrameNumbers('bird', { start: 0, end: 1 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'burn', frames: this.anims.generateFrameNumbers('fireball_projectile', { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'puff', frames: this.anims.generateFrameNumbers('death_effect', { start: 0, end: 11 }), frameRate: 24, repeat: 0 });
        this.bird.setFrame(0); this.bird.setDisplaySize(60, 59); this.bird.body.setSize(40, 30);
        this.bird.setCollideWorldBounds(true).body.onWorldBounds = true; this.bird.body.setAllowGravity(false);
        
        const getReadyText = this.add.text(width / 2, height / 3, '¡Prepárate!', { fontSize: '48px', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
        const birdFloat = this.tweens.add({ targets: this.bird, y: 310, ease: 'Sine.easeInOut', duration: 400, yoyo: true, repeat: -1 });
        this.physics.world.on('worldbounds', (body) => { if (body.gameObject === this.bird) this.hitPipe(); });
        this.pipeCollider = this.physics.add.collider(this.bird, this.pipes, this.hitPipe, null, this);
        this.fireballCollider = this.physics.add.collider(this.bird, this.fireballs, this.hitPipe, null, this);
        this.input.on('pointerdown', () => this.flap(getReadyText, birdFloat)); this.input.keyboard.on('keydown-SPACE', () => this.flap(getReadyText, birdFloat));
        this.score = 0; 
        
        this.scoreText = this.add.text(width / 2, 50, '', { fontSize: '48px', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0).setDepth(10).setScrollFactor(0);
        
        this.gameOverContainer = this.createGameOverScreen(); this.gameOverContainer.setScrollFactor(0);
        
        const textStyle = { fontSize: '16px', fill: '#ffffff', backgroundColor: '#00000080', padding: { x: 5, y: 3 } };
        this.immortalText = this.add.text(10, 10, 'Inmortal: OFF (I)', textStyle).setScrollFactor(0).setDepth(100);
        this.debugText = this.add.text(10, 30, 'Debug: OFF (D)', textStyle).setScrollFactor(0).setDepth(100);

        this.input.keyboard.on('keydown-I', () => { this.isImmortal = !this.isImmortal; if (this.isImmortal) { this.immortalText.setText('Inmortal: ON (I)').setColor('#ff0000'); this.bird.setAlpha(0.5); this.pipeCollider.active = false; this.fireballCollider.active = false; this.bird.setCollideWorldBounds(false); } else { this.immortalText.setText('Inmortal: OFF (I)').setColor('#ffffff'); this.bird.setAlpha(1.0); this.pipeCollider.active = true; this.fireballCollider.active = true; this.bird.setCollideWorldBounds(true); } });

        // AÑADIDO: Listener para la tecla 'D' para activar/desactivar el debug de físicas
        this.input.keyboard.on('keydown-D', () => {
            const newVisibility = !this.physics.world.debugGraphic.visible;
            this.physics.world.debugGraphic.setVisible(newVisibility);
            this.physics.world.drawDebug = newVisibility;
            this.debugText.setText(`Debug: ${newVisibility ? 'ON' : 'OFF'} (D)`).setColor(newVisibility ? '#ff00ff' : '#ffffff');
        });

        this.scale.on('resize', this.resizeAllElements, this);
    }

    resizeAllElements(gameSize) {
        const { width, height } = gameSize;
    
        this.background.setPosition(width / 2, height / 2);
        this.background.setSize(width, height);
        this.background.tileScaleX = height / this.textures.get('background').getSourceImage().height;
        this.background.tileScaleY = this.background.tileScaleX;

        if (this.scoreText) this.scoreText.setX(width / 2);
        if (this.gameOverContainer) this.gameOverContainer.setPosition(width / 2, height / 2);
    }

    update() {
        if (this.gameOver || !this.gameStarted) return;
        this.background.tilePositionX += 0.5 / 0.75;
        if (this.bird.body.velocity.y < 0) { this.bird.angle = Phaser.Math.Clamp(this.bird.angle - 5, -30, 90); } else if (this.bird.angle < 90) { this.bird.angle += 2.5; }
        
        // AÑADIDO: Lógica para actualizar la posición y rotación de la flecha guía
        if (this.isArrowGuideActive && this.guideArrow) {
            let closestPipe = null;
            let minDistance = Infinity;

            // Encontrar la tubería superior más cercana a la derecha del pájaro
            this.pipes.getChildren().forEach(pipe => {
                if (pipe.texture.key === 'pipe-cap' && pipe.flipY && pipe.x > this.bird.x) {
                    const distance = pipe.x - this.bird.x;
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestPipe = pipe;
                    }
                }
            });

            if (closestPipe) {
                // Si la tubería ya está en pantalla, desactivar la guía
                if (closestPipe.x < this.cameras.main.scrollX + this.cameras.main.width) {
                    this.isArrowGuideActive = false;
                    this.guideArrow.destroy();
                    this.guideArrow = null;
                } else {
                    // Calcular el punto medio del hueco de la tubería
                    const targetX = closestPipe.x;
                    const targetY = closestPipe.y + (this.currentPipeGap / 2);
                    
                    // Posicionar la flecha cerca del pájaro y apuntar al objetivo
                    this.guideArrow.setPosition(this.bird.x + 40, this.bird.y);
                    const angle = Phaser.Math.Angle.Between(this.guideArrow.x, this.guideArrow.y, targetX, targetY);
                    this.guideArrow.setRotation(angle);
                    this.guideArrow.setVisible(true);
                }
            }
        }
        
        this.fireballs.getChildren().forEach(fireball => { const leftBound = this.cameras.main.scrollX - 100; const rightBound = this.cameras.main.scrollX + this.cameras.main.width + 100; if (fireball.x < leftBound || fireball.x > rightBound) { fireball.destroy(); } });
        const cameraRotation = this.cameras.main.rotation; this.scoreText.rotation = -cameraRotation; this.gameOverContainer.rotation = -cameraRotation;
    }

    flap(getReadyText, birdFloat) {
        if (this.gameOver) return; this.sound.play('flap_sfx');
        if (!this.gameStarted) {
            this.gameStarted = true; this.bird.body.setAllowGravity(true).setGravityY(this.GRAVITY_STRENGTH);
            birdFloat.stop(); getReadyText.destroy(); this.scoreText.setAlpha(1).setText(this.score);
            this.bird.anims.play('flap', true); this.pipeTimer = this.time.addEvent({ delay: 1500, callback: this.addPipeRow, callbackScope: this, loop: true });
        }
        this.bird.setVelocityY(this.FLAP_VELOCITY); this.bird.setAngle(-30);
    }

    addPipeRow() {
        const { width, height } = this.cameras.main;
        const pipeWidth = 90; const spawnX = width + this.cameras.main.scrollX;
        let isMover = this.score >= 10 ? Phaser.Math.Between(0, 1) === 1 : false; let gap = this.currentPipeGap;
        const safeAreaMargin = 80;
        const pipeY = Phaser.Math.Between(safeAreaMargin + (gap / 2), height - safeAreaMargin - (gap / 2));
        this.createPipePair(spawnX, pipeY, gap, pipeWidth, isMover, 0);
        const scoreZone = this.add.zone(spawnX + (pipeWidth / 2), 0, 5, height).setOrigin(0, 0);
        this.physics.world.enable(scoreZone); scoreZone.body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
        this.physics.add.overlap(this.bird, scoreZone, () => { scoreZone.destroy(); this.score++; this.scoreText.setText(this.score); this.updateScoreAndDifficulty(); });
    }

    createPipePair(x, y, gap, width, isMover, horizontalOffset = 0) {
        const capHeight = 30; const bodyWidth = 88;
        const upperBody = this.pipes.create(x, y - (gap / 2) - capHeight, 'pipe-body').setOrigin(0, 1);
        const upperCap = this.pipes.create(x - (width - bodyWidth) / 2, y - (gap / 2), 'pipe-cap').setOrigin(0, 1);
        const lowerBody = this.pipes.create(x, y + (gap / 2) + capHeight, 'pipe-body').setOrigin(0, 0);
        const lowerCap = this.pipes.create(x - (width - bodyWidth) / 2, y + (gap / 2), 'pipe-cap').setOrigin(0, 0);
        const verticalPipeBuffer = 300; 
        const setupPart = (part, isBody, isUpper) => {
            part.setImmovable(true).body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
            if (isBody) { let height = isUpper ? part.y : this.cameras.main.height - part.y; part.setDisplaySize(bodyWidth, height + verticalPipeBuffer); } else { part.setDisplaySize(width, capHeight); }
            if (isUpper) { part.setFlipY(true); }
        };
        setupPart(upperBody, true, true); setupPart(upperCap, false, true); setupPart(lowerBody, true, false); setupPart(lowerCap, false, false);
        if (isMover) {
            this.tweens.add({
                targets: [upperBody, upperCap, lowerBody, lowerCap], y: Phaser.Math.RND.pick([`+=${this.PIPE_VERTICAL_MOVEMENT}`, `-=${this.PIPE_VERTICAL_MOVEMENT}`]),
                duration: this.currentTweenDuration, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
                onUpdate: () => {
                    const newUpperY = upperCap.y - capHeight; upperBody.y = newUpperY; upperBody.setDisplaySize(bodyWidth, newUpperY + verticalPipeBuffer);
                    const newLowerY = lowerCap.y + capHeight; lowerBody.y = newLowerY; lowerBody.setDisplaySize(bodyWidth, this.cameras.main.height - newLowerY + verticalPipeBuffer);
                }
            });
        }
    }

    updateScoreAndDifficulty() {
        if (this.isWallEventActive || this.isProjectileEventActive) return;
        if (this.score > 0 && this.score >= this.nextProjectileScore) { this.nextProjectileScore += 10; this.startProjectileEvent(); return; }
        if (this.score >= this.nextWallScore) { this.nextWallScore += 30; this.isWallEventActive = true; this.generatePipeWall(); return; }
        if (this.currentPipeGap > this.MIN_PIPE_GAP) this.currentPipeGap = Math.max(this.MIN_PIPE_GAP, this.INITIAL_PIPE_GAP - Math.floor(this.score / 5) * 3);
        if (this.currentTweenDuration > this.MIN_TWEEN_DURATION) this.currentTweenDuration = Math.max(this.MIN_TWEEN_DURATION, this.INITIAL_TWEEN_DURATION - this.score * 40);
    }

    rotateViewAfterEvent() {
        this.isRotated = !this.isRotated; const targetRotation = this.isRotated ? Math.PI : 0;
        this.tweens.add({ targets: this.cameras.main, rotation: targetRotation, duration: 600, ease: 'Sine.easeInOut' });
    }

    startProjectileEvent() {
        this.isProjectileEventActive = true; this.pipeTimer.paused = true; this.projectileEventCount++;
        
        this.cameras.main.stopFollow();
        
        this.tweens.add({ targets: this.cameras.main, zoom: 1, scrollY: 0, duration: 500, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: this.cameras.main, scrollX: this.bird.x - this.cameras.main.width / 2, duration: 800, ease: 'Power2' });
        const startTheFireballs = () => {
            const eventDuration = 10000; const fireballInterval = 550; const fireballSpeed = 320;
            const launchFireball = () => {
                if (this.gameOver) return; const verticalSpread = 100; const birdY = this.bird.y;
                const createFireball = (fromLeft, forcedY) => {
                    let spawnY = forcedY !== undefined ? forcedY : Phaser.Math.Between(birdY - verticalSpread, birdY + verticalSpread);
                    spawnY = Phaser.Math.Clamp(spawnY, 50, this.cameras.main.height - 50);
                    const spawnX = fromLeft ? this.cameras.main.scrollX - 50 : this.cameras.main.scrollX + this.cameras.main.width + 50;
                    const velocityX = fromLeft ? fireballSpeed : -fireballSpeed; const fireball = this.fireballs.create(spawnX, spawnY, 'fireball_projectile');
                    fireball.body.setAllowGravity(false); fireball.setVelocityX(velocityX); fireball.setDisplaySize(80, 80);
                    fireball.body.setCircle(22); fireball.anims.play('burn', true); fireball.setFlipX(!fromLeft);
                };
                if (this.projectileEventCount <= 2) { createFireball(this.fireballFromLeftNext); } else {
                    const separation = 185; const centerPoint = Phaser.Math.Between(birdY - 50, birdY + 50);
                    let y1 = centerPoint - (separation / 2); let y2 = centerPoint + (separation / 2);
                    createFireball(true, y1); createFireball(false, y2);
                }
            };
            const fireballTimer = this.time.addEvent({ delay: fireballInterval, callback: launchFireball, loop: true });
            this.time.delayedCall(eventDuration, () => {
                fireballTimer.remove();
                this.time.delayedCall(2000, () => {
                    if (this.gameOver) return;
                    this.tweens.add({ targets: this.cameras.main, scrollX: 0, duration: 800, ease: 'Power2',
                        onComplete: () => {
                            if (this.gameOver) return; if (this.projectileEventCount <= 2) { this.fireballFromLeftNext = !this.fireballFromLeftNext; }
                            this.isProjectileEventActive = false; this.rotateViewAfterEvent(); this.pipeTimer.paused = false;
                            this.score++; this.scoreText.setText(this.score); this.updateScoreAndDifficulty();
                        }
                    });
                });
            });
        };
        const pipeCheckTimer = this.time.addEvent({ delay: 100, callback: () => { const pipesOnScreen = this.pipes.getChildren().some(pipe => pipe.x + pipe.displayWidth > this.cameras.main.scrollX); if (!pipesOnScreen) { pipeCheckTimer.remove(); startTheFireballs(); } }, loop: true });
    }

    generatePipeWall() {
        this.pipeTimer.paused = true;
        const startTheWall = () => {
            const wallPipeCount = 15; const pipeWidth = 90; const gap = 140;
            const centerY = this.cameras.main.height / 2; const direction = Phaser.Math.RND.pick([-1, 1]);
            for (let i = 0; i < wallPipeCount; i++) {
                this.time.delayedCall(i * 150, () => {
                    if (this.gameOver) return; const spawnX = this.cameras.main.width + this.cameras.main.scrollX;
                    const progress = i / (wallPipeCount - 1); const easedValue = Phaser.Math.Easing.Sine.InOut(progress);
                    const offset = (-this.currentWallAmplitude + (easedValue * this.currentWallAmplitude * 2)) * direction;
                    this.createPipePair(spawnX, centerY + offset, gap, pipeWidth, false, 0);
                });
            }
            this.time.delayedCall(wallPipeCount * 150 + 1000, () => {
                if (this.gameOver) return; this.currentWallAmplitude = Math.min(this.MAX_WALL_AMPLITUDE, this.currentWallAmplitude + this.WALL_AMPLITUDE_INCREMENT);
                const scoreZone = this.add.zone(this.cameras.main.width + this.cameras.main.scrollX + 200, 0, 5, this.cameras.main.height).setOrigin(0, 0);
                this.physics.world.enable(scoreZone); scoreZone.body.setAllowGravity(false).setVelocityX(this.currentPipeSpeed);
                this.physics.add.overlap(this.bird, scoreZone, () => {
                    scoreZone.destroy(); this.score += 1; this.scoreText.setText(this.score);
                    this.isWallEventActive = false; this.nextProjectileScore = this.score + 10;
                    
                    this.cameras.main.startFollow(this.bird, true, 0.1, 0.1);

                    this.tweens.add({ targets: this.cameras.main, zoom: 1.3, duration: 500, ease: 'Sine.easeInOut' });

                    // AÑADIDO: Activar la guía con flecha solo la primera vez
                    if (!this.isFirstWallCleared) {
                        this.isFirstWallCleared = true;
                        this.isArrowGuideActive = true;
                        // Crear el objeto gráfico para la flecha
                        this.guideArrow = this.add.graphics({ lineStyle: { width: 2, color: 0x000000 }, fillStyle: { color: 0x00ff00 } });
                        this.guideArrow.fillTriangle(0, -8, 20, 0, 0, 8);
                        this.guideArrow.setDepth(200).setVisible(false);
                    }

                    this.time.delayedCall(1500, () => { if (this.gameOver) return; this.pipeTimer.paused = false; this.updateScoreAndDifficulty(); });
                });
            });
        }
        const pipeCheckTimer = this.time.addEvent({ delay: 100, callback: () => { const pipesOnScreen = this.pipes.getChildren().some(pipe => pipe.x + pipe.displayWidth > this.cameras.main.scrollX); if (!pipesOnScreen) { pipeCheckTimer.remove(); startTheWall(); } }, loop: true });
    }

    hitPipe() {
        if (this.gameOver) return; 
        this.gameOver = true;
        this.time.removeAllEvents();
        this.bird.setVisible(false);
        const deathSprite = this.add.sprite(this.bird.x, this.bird.y, 'death_effect'); 
        deathSprite.setDisplaySize(60, 59); 
        deathSprite.play('puff');
        deathSprite.on('animationcomplete', () => { deathSprite.destroy(); }); 
        this.bird.anims.stop();
        if (!this.isImmortal) { 
            const scores = JSON.parse(localStorage.getItem('myGameScores')) || []; 
            scores.push(this.score); 
            localStorage.setItem('myGameScores', JSON.stringify(scores));
        }
        this.physics.pause(); 
        this.tweens.pauseAll();
        this.cameras.main.flash(250, 255, 255, 255); 
        this.showGameOverScreen();
    }
    
    createGameOverScreen() {
        const { width, height } = this.cameras.main;
        const container = this.add.container(width / 2, height / 2).setAlpha(0).setDepth(100);
        const gameOverImage = this.add.image(0, -60, 'game-over-img').setOrigin(0.5);
        const scoreBoard = this.add.text(0, 20, '', { fontSize: '28px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        const restartButton = this.add.sprite(0, 90, 'restart-button').setOrigin(0.5);
        
        restartButton.setInteractive({ useHandCursor: true })
            .on('pointerover', () => restartButton.setFrame(1))
            .on('pointerout', () => restartButton.setFrame(0))
            .on('pointerdown', () => {
                restartButton.setFrame(2);
                this.time.delayedCall(100, () => {
                    this.scene.restart();
                });
            });

        container.add([gameOverImage, scoreBoard, restartButton]); 
        return container;
    }

    showGameOverScreen() {
        const scoreBoard = this.gameOverContainer.getAt(1); scoreBoard.setText(`Puntuación: ${this.score}`);
        this.add.tween({ targets: this.gameOverContainer, alpha: 1, duration: 300, ease: 'Power2' });
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
            // MODIFICADO: debug se establece en true para habilitar el motor de dibujo, pero se oculta al inicio.
            gravity: { y: 0 }, 
            debug: true 
        }
    },
    scene: MainScene
};

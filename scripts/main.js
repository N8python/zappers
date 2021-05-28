const crosshair = document.getElementById("crosshair");
let crossOffset = { x: 0, y: 0 };
let mainScene;
const ORIGIN = new THREE.Vector3(0, 0, 0);
const staminaBar = document.getElementById("staminaBar");
const staminaCtx = staminaBar.getContext("2d");
const staminaGrad = staminaCtx.createLinearGradient(0, 0, 200, 0);
staminaGrad.addColorStop(0, "blue");
staminaGrad.addColorStop(1, "cyan");
const healthBar = document.getElementById("healthBar");
const healthCtx = healthBar.getContext("2d");
const healthGrad = healthCtx.createLinearGradient(0, 0, 200, 0);
healthGrad.addColorStop(0, "green");
healthGrad.addColorStop(1, "lime");
const loadEmitter = async(name) => {
    const text = await fetch(`./assets/particles/${name}.json`);
    const json = await text.json();
    const system = await Nebula.System.fromJSONAsync(json.particleSystemState, THREE, { shouldAutoEmit: false });
    const renderer = new Nebula.SpriteRenderer(mainScene.third.scene, THREE);
    const particles = system.addRenderer(renderer);
    particles.emit({
        onStart: () => {},
        onUpdate: () => {},
        onEnd: () => {},
    });
    mainScene.emitters.push(particles);
    particles.clientName = name;
    return system;
}
const padTo = num => {
    num = Math.floor(num).toString();
    while (num.length < 4) {
        num = "0" + num;
    }
    return num;
}
let transactionSettled = true;
const addCoins = num => {
    transactionSettled = false;
    let addInterval = setInterval(() => {
        mainScene.player.coins += Math.ceil(num / 10);
        num -= Math.ceil(num / 10);
        if (num < 2) {
            mainScene.player.coins += 1;
            transactionSettled = true;
            clearInterval(addInterval);
        }
        mainScene.player.coins = Math.min(mainScene.player.coins, 9999);
    }, 30)
}
const subtractCoins = num => {
    transactionSettled = false;
    num *= -1;
    num -= 9;
    let addInterval = setInterval(() => {
        mainScene.player.coins += Math.ceil(num / 10);
        num -= Math.ceil(num / 10);
        if (num > -10) {
            //localProxy.coins += 1;
            transactionSettled = true;
            clearInterval(addInterval);
        }
        mainScene.player.coins = Math.max(mainScene.player.coins, 0);
    }, 30)
}
class MainScene extends Scene3D {
    constructor() {
        super({ key: 'MainScene' })
    }

    init() {
        this.accessThirdDimension();
    }

    async create() {
        this.third.warpSpeed("-ground", "-sky", "-orbitControls");
        mainScene = this;
        this.delta = 16.67;
        this.timeScale = 1;
        this.third.load.preload("ship", "./assets/models/ship.fbx");
        this.third.load.preload("hunter", "./assets/models/hunter.fbx");
        this.third.load.preload("tanker", "./assets/models/tanker.fbx");
        this.third.load.preload("healingStation", "./assets/models/healingStation.fbx");
        this.third.load.preload("asteroid", "./assets/models/asteroid.fbx");
        this.third.renderer.setPixelRatio(2);
        this.asteroidModel = await this.third.load.fbx("asteroid");
        this.shipModel = await this.third.load.fbx("ship");
        this.hunterModel = await this.third.load.fbx("hunter");
        this.tankerModel = await this.third.load.fbx("tanker");
        this.healingStationModel = await this.third.load.fbx("healingStation");
        this.asteroidModel.scale.set(0.025, 0.025, 0.025);
        this.shipModel.scale.set(0.025, 0.025, 0.025);
        this.hunterModel.scale.set(0.025, 0.025, 0.025);
        this.tankerModel.scale.set(0.035, 0.035, 0.035);
        this.healingStationModel.scale.set(0.035, 0.035, 0.035);
        const skyGeom = new THREE.SphereGeometry(1000, 1000, 32, 32);
        const skyMat = new THREE.MeshBasicMaterial({
            color: "white",
            map: await this.third.load.texture("./assets/images/starfield.png")
        });
        skyMat.side = THREE.DoubleSide;
        const skyMesh = new THREE.Mesh(skyGeom, skyMat);
        this.third.scene.add(skyMesh);
        const mesh = new ExtendedObject3D();
        // const playerModel = await this.third.load.fbx("ship");
        // playerModel.scale.set(0.025, 0.025, 0.025);
        //mesh.add(playerModel);
        this.third.add.existing(mesh);
        this.player = mesh;
        this.player.mesh = this.player;
        this.player.cooldown = 0;
        this.player.roll = 0;
        this.player.boosting = false;
        this.player.stamina = 100;
        this.player.staminaChange = 0;
        this.player.health = 250;
        this.player.maxHealth = 250;
        this.player.healthChange = 0;
        this.player.staminaCooldown = 0;
        this.player.coins = 0;
        this.player.position.z = -400;
        this.player.loseStamina = (amt) => {
            amt = Math.min(amt, this.player.stamina);
            this.player.stamina -= amt;
            this.player.staminaChange += amt;
        }
        this.player.loseHealth = (amt) => {
                amt = Math.min(amt, this.player.health);
                this.player.health -= amt;
                this.player.healthChange += amt;
            }
            // this.player = { position: new THREE.Vector3(), rotation: new THREE.Vector3() };
        this.player.velocity = { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
        this.firstPersonControls = new FirstPersonControls(this.third.camera, this.player, {});
        this.playerRot = { x: 0, y: 0, z: 0 };
        this.bullets = [];
        this.entities = [];
        this.emitters = [];
        for (let i = 0; i < 60; i++) {
            const explosion = await loadEmitter("explosion");
            explosion.emitters[0].currentEmitTime = 100;
            this.emitters.push(explosion);
        }
        for (let i = 0; i < 1000; i++) {
            const pos = new THREE.Vector3(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000);
            while (pos.distanceTo(ORIGIN) > 1000) {
                pos.x = Math.random() * 2000 - 1000;
                pos.y = Math.random() * 2000 - 1000;
                pos.z = Math.random() * 2000 - 1000;
            }
            this.entities.push(new Asteroid({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.asteroidModel
            }));
        }
        const spawnMinerSize = 500;
        for (let i = 0; i < 25; i++) {
            const pos = new THREE.Vector3(Math.random() * spawnMinerSize - spawnMinerSize / 2, Math.random() * spawnMinerSize - spawnMinerSize / 2, Math.random() * spawnMinerSize - spawnMinerSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnMinerSize / 2) {
                pos.x = Math.random() * spawnMinerSize - spawnMinerSize / 2;
                pos.y = Math.random() * spawnMinerSize - spawnMinerSize / 2;
                pos.z = Math.random() * spawnMinerSize - spawnMinerSize / 2;
            }
            this.entities.push(new Miner({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.shipModel
            }));
        }
        const spawnHunterSize = 1000;
        for (let i = 0; i < 5; i++) {
            const pos = new THREE.Vector3(Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnHunterSize / 2) {
                pos.x = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.y = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.z = Math.random() * spawnHunterSize - spawnHunterSize / 2;
            }
            this.entities.push(new Hunter({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.hunterModel
            }));
        }
        const spawnTankerSize = 500;
        for (let i = 0; i < 5; i++) {
            const pos = new THREE.Vector3(Math.random() * spawnTankerSize - spawnTankerSize / 2, Math.random() * spawnTankerSize - spawnTankerSize / 2, Math.random() * spawnTankerSize - spawnTankerSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnTankerSize / 2) {
                pos.x = Math.random() * spawnTankerSize - spawnTankerSize / 2;
                pos.y = Math.random() * spawnTankerSize - spawnTankerSize / 2;
                pos.z = Math.random() * spawnTankerSize - spawnTankerSize / 2;
            }
            this.entities.push(new Tanker({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.tankerModel
            }));
        }
        const spawnHealerSize = 500;
        for (let i = 0; i < 3; i++) {
            const pos = new THREE.Vector3(Math.random() * spawnHealerSize - spawnHealerSize / 2, Math.random() * spawnHealerSize - spawnHealerSize / 2, Math.random() * spawnHealerSize - spawnHealerSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnHealerSize / 2) {
                pos.x = Math.random() * spawnHealerSize - spawnHealerSize / 2;
                pos.y = Math.random() * spawnHealerSize - spawnHealerSize / 2;
                pos.z = Math.random() * spawnHealerSize - spawnHealerSize / 2;
            }
            this.entities.push(new Healer({
                x: pos.x,
                y: pos.y,
                z: pos.y,
                model: this.healingStationModel
            }));
        }
        this.keys = {
            w: this.input.keyboard.addKey('w'),
            s: this.input.keyboard.addKey('s'),
            q: this.input.keyboard.addKey('q')
        }
        this.initiated = true;
        this.input.on('pointerdown', () => {
            this.input.mouse.requestPointerLock();
            if (this.input.mouse.locked && this.player.cooldown < 1 && this.player.stamina > 5) {
                this.player.loseStamina(5);
                this.player.cooldown = 15;
                const raycaster = new THREE.Raycaster()
                const offsets = [
                    [4, 2, 1],
                    [-4, 2, 1],
                    [4, -2, 1],
                    [-4, -2, 1]
                ];
                offsets.forEach(o => {
                    const x = 0
                    const y = 0
                    const force = 5
                    const pos = new THREE.Vector3()

                    raycaster.setFromCamera({ x, y }, this.third.camera)
                    pos.copy(raycaster.ray.direction);
                    pos.add(raycaster.ray.origin);
                    const offset = new THREE.Vector3(...o);
                    offset.applyQuaternion(this.third.camera.quaternion);
                    pos.add(offset);
                    const realPos = new THREE.Vector3();
                    realPos.copy(pos);
                    pos.copy(raycaster.ray.direction);
                    pos.multiplyScalar(6);
                    if (this.player.boosting) {
                        pos.multiplyScalar(10);
                    }
                    this.bullets.push(new Bullet({
                        x: realPos.x,
                        y: realPos.y,
                        z: realPos.z,
                        xVel: pos.x,
                        yVel: pos.y,
                        zVel: pos.z,
                        source: this.player,
                        color: "red"
                    }));
                })
            }
        });
        this.input.on('pointermove', pointer => {
            if (this.input.mouse.locked && !this.player.boosting) {
                this.firstPersonControls.update(pointer.movementX, pointer.movementY);
            }
        });
        this.events.on('update', () => {
            this.firstPersonControls.update(0, 0);
        });
    }
    update(time, delta) {
        if (!this.initiated) {
            return;
        }
        stats.begin();
        this.delta = delta;
        this.timeScale = delta / 16.67;
        staminaCtx.fillStyle = "#333333";
        staminaCtx.fillRect(0, 0, 150, 30);
        staminaCtx.fillStyle = "white";
        staminaCtx.fillRect(3 + 144 * (this.player.stamina / 100), 3, 144 * (this.player.staminaChange / 100), 24);
        staminaCtx.fillStyle = staminaGrad;
        staminaCtx.fillRect(3, 3, 144 * (this.player.stamina / 100), 24);
        healthCtx.fillStyle = "#333333";
        healthCtx.fillRect(0, 0, 150, 30);
        healthCtx.fillStyle = "white";
        healthCtx.fillRect(3 + 144 * (this.player.health / 250), 3, 144 * (this.player.healthChange / 250), 24);
        healthCtx.fillStyle = healthGrad;
        healthCtx.fillRect(3, 3, 144 * (this.player.health / 250), 24);
        this.player.stamina = Math.min(Math.max(this.player.stamina, 0), 100);
        this.player.staminaChange = Math.min(Math.max(this.player.staminaChange, 0), 100);
        if (this.player.staminaChange === 0 && this.player.staminaCooldown < 1) {
            this.player.stamina += 0.33;
        }
        if (this.player.staminaChange < 10) {
            this.player.staminaChange--;
            if (this.player.staminaChange > 0) {
                this.player.staminaCooldown = 120;
            }
        } else {
            this.player.staminaChange *= 0.95;
        }
        this.player.stamina = Math.min(Math.max(this.player.stamina, 0), 100);
        this.player.staminaChange = Math.min(Math.max(this.player.staminaChange, 0), 100);
        this.player.health = Math.min(Math.max(this.player.health, 0), 250);
        this.player.healthChange = Math.min(Math.max(this.player.healthChange, 0), 250);
        if (this.player.healthChange < 10) {
            this.player.healthChange--;
        } else {
            this.player.healthChange *= 0.95;
        }
        this.player.health = Math.min(Math.max(this.player.health, 0), 250);
        this.player.healthChange = Math.min(Math.max(this.player.healthChange, 0), 250);
        this.player.cooldown -= 1 * mainScene.timeScale;
        this.player.staminaCooldown--;
        this.bullets.forEach(bullet => {
            bullet.update();
            if (bullet.source !== this.player && bullet.mesh.position.distanceTo(this.player.position) < 5) {
                bullet.destroy();
                this.player.loseHealth(5 * Math.floor(Math.random() * 5) * (bullet.source instanceof Healer ? -1 : 1));
            }
        });
        this.entities.forEach(entity => {
            entity.update();
            if (entity.maxHealth && entity.health > entity.maxHealth) {
                entity.health = entity.maxHealth;
            }
            if ((entity instanceof Hunter || entity instanceof Miner) && entity.mesh.position.distanceTo(this.player.position) < 10) {
                entity.velocity.position.x *= -1;
                entity.velocity.position.y *= -1;
                entity.velocity.position.z *= -1;
                this.player.velocity.position.x *= -1;
                this.player.velocity.position.y *= -1;
                this.player.velocity.position.z *= -1;
                entity.mesh.position.x += entity.velocity.position.x;
                entity.mesh.position.y += entity.velocity.position.y;
                entity.mesh.position.z += entity.velocity.position.z;
                mainScene.player.position.x += mainScene.player.velocity.position.x;
                mainScene.player.position.y += mainScene.player.velocity.position.y;
                mainScene.player.position.z += mainScene.player.velocity.position.z;
            }
        });
        //this.player.velocity.position.multiplyScalar(0.95);
        this.player.position.x += this.player.velocity.position.x;
        this.player.position.y += this.player.velocity.position.y;
        this.player.position.z += this.player.velocity.position.z;
        //this.firstPersonControls.update(0, 0);
        this.player.velocity.position.x *= 0.975;
        this.player.velocity.position.y *= 0.975;
        this.player.velocity.position.z *= 0.975;
        if (this.keys.w.isDown || this.keys.s.isDown || this.player.boosting) {
            const vec = new THREE.Vector3();
            this.third.camera.getWorldDirection(vec);
            vec.multiplyScalar(0.02);
            if (this.player.boosting) {
                vec.multiplyScalar(10);
            }
            if (this.keys.s.isDown) {
                vec.multiplyScalar(-1);
            }
            vec.multiplyScalar(this.timeScale);
            this.player.velocity.position.x += vec.x;
            this.player.velocity.position.y += vec.y;
            this.player.velocity.position.z += vec.z;
        }
        if (this.keys.q.isDown && this.player.stamina > 99) {
            this.player.loseStamina(100);
            this.player.boosting = true;
        }
        if (this.player.boosting) {
            this.third.camera.rotation.z += this.player.roll;
            this.player.roll += 0.1 * this.timeScale;
            if (this.player.roll >= Math.PI * 2) {
                this.player.roll = 0;
                this.player.boosting = false;
            }
        }
        if (this.entities.filter(e => e instanceof Asteroid).length < 1000) {
            const pos = new THREE.Vector3(Math.random() * 2000 - 1000, Math.random() * 2000 - 1000, Math.random() * 2000 - 1000);
            while (pos.distanceTo(ORIGIN) > 1000) {
                pos.x = Math.random() * 2000 - 1000;
                pos.y = Math.random() * 2000 - 1000;
                pos.z = Math.random() * 2000 - 1000;
            }
            this.entities.push(new Asteroid({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.asteroidModel
            }));
        }
        if (this.entities.filter(e => e instanceof Miner).length < 25) {
            const spawnMinerSize = 500;
            const pos = new THREE.Vector3(Math.random() * spawnMinerSize - spawnMinerSize / 2, Math.random() * spawnMinerSize - spawnMinerSize / 2, Math.random() * spawnMinerSize - spawnMinerSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnMinerSize / 2) {
                pos.x = Math.random() * spawnMinerSize - spawnMinerSize / 2;
                pos.y = Math.random() * spawnMinerSize - spawnMinerSize / 2;
                pos.z = Math.random() * spawnMinerSize - spawnMinerSize / 2;
            }
            this.entities.push(new Miner({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.shipModel
            }));
        }
        if (this.entities.filter(e => e instanceof Hunter).length < 5) {
            const spawnHunterSize = 1000;
            const pos = new THREE.Vector3(Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnHunterSize / 2) {
                pos.x = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.y = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.z = Math.random() * spawnHunterSize - spawnHunterSize / 2;
            }
            this.entities.push(new Hunter({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.hunterModel
            }));
        }
        if (this.entities.filter(e => e instanceof Tanker).length < 5) {
            const spawnHunterSize = 500;
            const pos = new THREE.Vector3(Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2, Math.random() * spawnHunterSize - spawnHunterSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnHunterSize / 2) {
                pos.x = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.y = Math.random() * spawnHunterSize - spawnHunterSize / 2;
                pos.z = Math.random() * spawnHunterSize - spawnHunterSize / 2;
            }
            this.entities.push(new Tanker({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                model: this.tankerModel
            }));
        }
        if (this.entities.filter(e => e instanceof Healer).length < 3) {
            const spawnHealerSize = 500;
            const pos = new THREE.Vector3(Math.random() * spawnHealerSize - spawnHealerSize / 2, Math.random() * spawnHealerSize - spawnHealerSize / 2, Math.random() * spawnHealerSize - spawnHealerSize / 2);
            while (pos.distanceTo(ORIGIN) > spawnHealerSize / 2) {
                pos.x = Math.random() * spawnHealerSize - spawnHealerSize / 2;
                pos.y = Math.random() * spawnHealerSize - spawnHealerSize / 2;
                pos.z = Math.random() * spawnHealerSize - spawnHealerSize / 2;
            }
            this.entities.push(new Healer({
                x: pos.x,
                y: pos.y,
                z: pos.y,
                model: this.healingStationModel
            }));
        }
        document.getElementById("coinDisplay").innerHTML = padTo(this.player.coins, 4);
        //this.player.roll += 0.1;
        this.emitters.forEach(emitter => {
            if (emitter.emitters[0].currentEmitTime < 2) {
                emitter.update();
            }
            /*if (emitter.emitters[0].currentEmitTime < 2) {
                mainScene.emitters.splice(mainScene.emitters.indexOf(emitter), 1);
            }*/
        })
        stats.end();
    }
}

const config = {
    type: Phaser.WEBGL,
    transparent: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth * Math.max(1, window.devicePixelRatio / 2),
        height: window.innerHeight * Math.max(1, window.devicePixelRatio / 2)
    },
    scene: [MainScene],
    ...Canvas()
}

window.addEventListener('load', () => {
    enable3d(() => new Phaser.Game(config)).withPhysics('./lib')
});
var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
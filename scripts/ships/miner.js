class Miner {
    constructor({
        x,
        y,
        z,
        model
    }) {
        const mesh = new ExtendedObject3D();
        mesh.add(model.clone());
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        this.mesh = mesh;
        mainScene.third.add.existing(mesh);
        this.health = 50;
        this.maxHealth = 50;
        this.stamina = 50;
        this.coins = 0;
        this.cooldown = 0;
        this.kbCooldown = 0;
        this.target = null;
        this.velocity = { position: { x: 0, y: 0, z: 0 } };
        this.targetPos = new THREE.Vector3();
        this.killer = null;
    }
    update() {
        this.cooldown -= 1 * mainScene.timeScale;
        this.kbCooldown -= 1 * mainScene.timeScale;
        if (this.mesh.position.distanceTo(ORIGIN) > 1000) {
            this.destroy();
        }
        if (this.target === null) {
            let closestA;
            let closestDist = Infinity;
            mainScene.entities.forEach(entity => {
                if (entity instanceof Asteroid) {
                    const distToA = this.mesh.position.distanceTo(entity.mesh.position);
                    if (distToA < closestDist) {
                        closestA = entity;
                        closestDist = distToA;
                    }
                }
            });
            if (closestA) {
                this.target = closestA;
            }
        }
        if (this.target) {
            //this.mesh.lookAt(this.target.mesh.position);
            this.mesh.lookAt(this.targetPos);
            if (this.target === mainScene.player) {
                this.targetPos.x += ((this.target.position.x - this.targetPos.x) / 10) * mainScene.timeScale;
                this.targetPos.y += ((this.target.position.y - this.targetPos.y) / 10) * mainScene.timeScale;
                this.targetPos.z += ((this.target.position.z - this.targetPos.z) / 10) * mainScene.timeScale;
            } else {
                this.targetPos.x += ((this.target.mesh.position.x - this.targetPos.x) / 10) * mainScene.timeScale;
                this.targetPos.y += ((this.target.mesh.position.y - this.targetPos.y) / 10) * mainScene.timeScale;
                this.targetPos.z += ((this.target.mesh.position.z - this.targetPos.z) / 10) * mainScene.timeScale;
            }
            const vec = new THREE.Vector3();
            this.mesh.getWorldDirection(vec);
            vec.multiplyScalar(0.01);
            vec.multiplyScalar(mainScene.timeScale);
            this.velocity.position.x += vec.x;
            this.velocity.position.y += vec.y;
            this.velocity.position.z += vec.z;
            this.mesh.position.x += this.velocity.position.x;
            this.mesh.position.y += this.velocity.position.y;
            this.mesh.position.z += this.velocity.position.z;
            this.velocity.position.x *= 0.975;
            this.velocity.position.y *= 0.975;
            this.velocity.position.z *= 0.975;
            this.mesh.rotation.y += Math.PI;
            if (this.mesh.position.distanceTo(this.target === mainScene.player ? this.target.position : this.target.mesh.position) < 125 && this.cooldown < 0) {
                this.cooldown = 30;
                const raycaster = new THREE.Raycaster()
                const offsets = [
                    [2.5, 0, 0],
                    [-2.5, 0, 0]
                ];
                offsets.forEach(o => {
                    /*const x = 0;
                    const y = 0;
                    const pos = new THREE.Vector3();
                    const raycaster = new THREE.Raycaster();
                    raycaster.set(this.mesh.position, new THREE.Vector3(this.mesh.rotation.x, this.mesh.rotation.y, this.mesh.rotation.z).normalize());
                    pos.copy(raycaster.ray.direction);
                    pos.add(raycaster.ray.origin);
                    const offset = new THREE.Vector3(...o);
                    offset.applyQuaternion(this.mesh.quaternion);
                    pos.add(offset);
                    const realPos = new THREE.Vector3();
                    realPos.copy(pos);
                    pos.copy(raycaster.ray.direction);
                    pos.multiplyScalar(3);
                    mainScene.bullets.push(new Bullet({
                        x: realPos.x,
                        y: realPos.y,
                        z: realPos.z,
                        xVel: pos.x,
                        yVel: pos.y,
                        zVel: pos.z
                    }));*/
                    const offset = new THREE.Vector3(...o);
                    offset.applyQuaternion(this.mesh.quaternion);
                    mainScene.bullets.push(new Bullet({
                        x: this.mesh.position.x + offset.x,
                        y: this.mesh.position.y + offset.y,
                        z: this.mesh.position.z + offset.z,
                        xVel: vec.x * 300,
                        yVel: vec.y * 300,
                        zVel: vec.z * 300,
                        source: this,
                        color: "blue"
                    }));
                })
            }
            if (!mainScene.entities.includes(this.target) && (this.target !== mainScene.player)) {
                this.target = null;
            }
        }
        mainScene.bullets.forEach(bullet => {
            //console.log(this.mesh.position.distanceTo(bullet.mesh.position));
            if (this.mesh.position.distanceTo(bullet.mesh.position) < 5 && bullet.source !== this) {
                bullet.destroy();
                this.health -= 5 * Math.floor(Math.random() * 5) * (bullet.source instanceof Healer ? -1 : 1);
                if (this.kbCooldown < 0) {
                    this.velocity.position.x += bullet.velocity.x * 0.3;
                    this.velocity.position.y += bullet.velocity.y * 0.3;
                    this.velocity.position.z += bullet.velocity.z * 0.3;
                    this.kbCooldown = 30;
                }
                if ((bullet.source instanceof Miner && !(this.target instanceof Hunter)) || bullet.source === mainScene.player) {
                    this.target = bullet.source;
                }
                if (bullet.source instanceof Hunter) {
                    this.target = bullet.source;
                    mainScene.entities.forEach(entity => {
                        if (entity instanceof Miner && entity.mesh.position.distanceTo(this.mesh.position) < 200) {
                            entity.target = bullet.source;
                        }
                    })
                }

                this.killer = bullet.source;
            }
        });
        if (this.health < 1) {
            this.destroy(this.killer);
            this.explode();
        }
    }
    destroy(source) {
        if (source === mainScene.player) {
            addCoins(this.coins);
        } else if (source && source.coins !== undefined) {
            source.coins += this.coins;
        }
        this.mesh.visible = false;
        mainScene.entities.splice(mainScene.entities.indexOf(this), 1);
        mainScene.third.scene.children.splice(mainScene.third.scene.children.indexOf(this.mesh), 1);
    }
    explode() {
        const emitter = mainScene.emitters.find(emitter => emitter.emitters[0].currentEmitTime > 2 && emitter.clientName === "explosion");
        if (emitter) {
            emitter.emitters[0].position.x = this.mesh.position.x;
            emitter.emitters[0].position.y = this.mesh.position.y;
            emitter.emitters[0].position.z = this.mesh.position.z;
            emitter.emitters[0].currentEmitTime = 0;
        }
    }
}
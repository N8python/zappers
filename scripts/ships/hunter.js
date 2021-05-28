class Hunter {
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
        this.health = 200;
        this.maxHealth = 200;
        this.stamina = 100;
        this.coins = 0;
        this.cooldown = 0;
        this.target = null;
        this.velocity = { position: { x: 0, y: 0, z: 0 } };
        this.targetPos = new THREE.Vector3();
        this.killer = null;
    }
    update() {
        this.cooldown -= 1 * mainScene.timeScale;
        if (this.target === null) {
            let closestA;
            let closestDist = Infinity;
            mainScene.entities.forEach(entity => {
                if (entity instanceof Miner || entity instanceof Tanker || entity instanceof Healer) {
                    const distToA = this.mesh.position.distanceTo(entity.mesh.position) - Math.min(entity.coins, 300);
                    if (distToA < closestDist) {
                        closestA = entity;
                        closestDist = distToA;
                    }
                }
            });
            let playerScore = this.mesh.position.distanceTo(mainScene.player.position) - Math.min(mainScene.player.coins, 300);
            if (playerScore < closestDist) {
                closestDist = playerScore;
                closestA = mainScene.player;
            }
            if (closestA) {
                this.target = closestA;
            }
        }
        if (this.target) {
            //this.mesh.lookAt(this.target.mesh.position);
            const distToTarget = this.target === mainScene.player ? this.mesh.position.distanceTo(this.target.position) : this.mesh.position.distanceTo(this.target.mesh.position);
            const desiredPos = new THREE.Vector3();
            if (this.target === mainScene.player) {
                desiredPos.copy(this.target.position);
            } else {
                desiredPos.copy(this.target.mesh.position);
            }
            desiredPos.x += this.target.velocity.position.x * distToTarget / 4.5;
            desiredPos.y += this.target.velocity.position.y * distToTarget / 4.5;
            desiredPos.z += this.target.velocity.position.z * distToTarget / 4.5;
            this.mesh.lookAt(this.targetPos);
            //if (this.target === mainScene.player) {
            this.targetPos.x += ((desiredPos.x - this.targetPos.x) / 5) * mainScene.timeScale;
            this.targetPos.y += ((desiredPos.y - this.targetPos.y) / 5) * mainScene.timeScale;
            this.targetPos.z += ((desiredPos.z - this.targetPos.z) / 5) * mainScene.timeScale;
            //} else {
            //}
            const vec = new THREE.Vector3();
            this.mesh.getWorldDirection(vec);
            vec.multiplyScalar(0.015);
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
            if (this.mesh.position.distanceTo(this.target === mainScene.player ? this.target.position : this.target.mesh.position) < 300 && this.cooldown < 0) {
                this.cooldown = 60;
                const raycaster = new THREE.Raycaster()
                const offsets = [
                    [0, 1, 0],
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
                        color: "green"
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
                if (bullet.source === mainScene.player) {
                    this.health -= 5 * Math.floor(Math.random() * 5);
                }
                if (bullet.source instanceof Miner || bullet.source instanceof Tanker || bullet.source === mainScene.player) {
                    this.target = bullet.source;
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
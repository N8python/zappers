class Asteroid {
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
        this.velocity = {
            position: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 },
            rotation: { x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.01 }
        }
    }
    update() {
        this.mesh.position.x += this.velocity.position.x * mainScene.timeScale;
        this.mesh.position.y += this.velocity.position.y * mainScene.timeScale;
        this.mesh.position.z += this.velocity.position.z * mainScene.timeScale;
        this.mesh.rotation.x += this.velocity.rotation.x * mainScene.timeScale;
        this.mesh.rotation.y += this.velocity.rotation.y * mainScene.timeScale;
        this.mesh.rotation.z += this.velocity.rotation.z * mainScene.timeScale;
        if (this.mesh.position.distanceTo(ORIGIN) > 1000) {
            this.destroy();
        }
        mainScene.bullets.some(bullet => {
            //console.log(this.mesh.position.distanceTo(bullet.mesh.position));
            if (this.mesh.position.distanceTo(bullet.mesh.position) < 5) {
                bullet.destroy();
                this.destroy(bullet.source);
                /*setTimeout(async() => {
                    const explosion = await loadEmitter("explosion");
                    explosion.emitters[0].position.x = this.mesh.position.x;
                    explosion.emitters[0].position.y = this.mesh.position.y;
                    explosion.emitters[0].position.z = this.mesh.position.z;
                });*/
                this.explode();
                return true;
            }
        });
        if (this.mesh.position.distanceTo(mainScene.player.position) < 7.5) {
            this.destroy(mainScene.player);
            /*setTimeout(async() => {
                const explosion = await loadEmitter("explosion");
                explosion.emitters[0].position.x = this.mesh.position.x;
                explosion.emitters[0].position.y = this.mesh.position.y;
                explosion.emitters[0].position.z = this.mesh.position.z;
            });*/
            this.explode();
            mainScene.player.loseHealth(5 + Math.floor(Math.random() * 11));
            if (!mainScene.player.boosting) {
                mainScene.player.velocity.position.x *= -3;
                mainScene.player.velocity.position.y *= -3;
                mainScene.player.velocity.position.z *= -3;
            } else {
                mainScene.player.velocity.position.x *= -1;
                mainScene.player.velocity.position.y *= -1;
                mainScene.player.velocity.position.z *= -1;
            }
        }
        /*mainScene.entities.forEach(entity => {
            if (entity instanceof Miner) {
                if (this.mesh.position.distanceTo(entity.mesh.position) < 7.5) {
                    this.destroy(entity);
                    setTimeout(async() => {
                        const explosion = await loadEmitter("explosion");
                        explosion.emitters[0].position.x = this.mesh.position.x;
                        explosion.emitters[0].position.y = this.mesh.position.y;
                        explosion.emitters[0].position.z = this.mesh.position.z;
                    });
                    this.explode();
                    entity.health -= 5 + Math.floor(Math.random() * 11);
                    entity.velocity.position.x *= -1;
                    entity.velocity.position.y *= -1;
                    entity.velocity.position.z *= -1;
                }
            }
        })*/
    }
    destroy(source) {
        if (source === mainScene.player) {
            addCoins(Math.floor(Math.random() * 6) + 5);
        } else if (source && source.coins !== undefined) {
            source.coins += Math.floor(Math.random() * 6) + 5;
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
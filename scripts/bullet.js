const insertAt = (source, target, toInsert) => {
    return source.slice(0, source.indexOf(target) + target.length) +
        toInsert +
        source.slice(source.indexOf(target) + target.length);
}
class Bullet {
    constructor({
        x,
        y,
        z,
        xVel,
        yVel,
        zVel,
        source,
        color = "red"
    }) {
        this.color = color;
        const mesh = mainScene.third.add.box({ x, y, z, width: 0.25, height: 0.25, depth: 2.5 });
        mesh.material = Bullet.materials[color];
        /*const material = new THREE.MeshPhongMaterial({
            color: "white"
        });
        material.onBeforeCompile = (shader) => {
                this.shader = shader;
                shader.uniforms.shadeColor = { value: new THREE.Vector3(1.0, 0.0, 0.0) };
                shader.uniforms.stepX = { value: 0.0 };
                shader.uniforms.stepY = { value: 0.0 };
                shader.uniforms.stepZ = { value: 0.0 };
                shader.vertexShader = "varying vec3 fragPosition;\nuniform float stepX;\nuniform float stepY;\nuniform float stepZ;\n" + `vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
            
            float cnoise(vec3 P){
              vec3 Pi0 = floor(P); // Integer part for indexing
              vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
              Pi0 = mod(Pi0, 289.0);
              Pi1 = mod(Pi1, 289.0);
              vec3 Pf0 = fract(P); // Fractional part for interpolation
              vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
              vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
              vec4 iy = vec4(Pi0.yy, Pi1.yy);
              vec4 iz0 = Pi0.zzzz;
              vec4 iz1 = Pi1.zzzz;
            
              vec4 ixy = permute(permute(ix) + iy);
              vec4 ixy0 = permute(ixy + iz0);
              vec4 ixy1 = permute(ixy + iz1);
            
              vec4 gx0 = ixy0 / 7.0;
              vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
              gx0 = fract(gx0);
              vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
              vec4 sz0 = step(gz0, vec4(0.0));
              gx0 -= sz0 * (step(0.0, gx0) - 0.5);
              gy0 -= sz0 * (step(0.0, gy0) - 0.5);
            
              vec4 gx1 = ixy1 / 7.0;
              vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
              gx1 = fract(gx1);
              vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
              vec4 sz1 = step(gz1, vec4(0.0));
              gx1 -= sz1 * (step(0.0, gx1) - 0.5);
              gy1 -= sz1 * (step(0.0, gy1) - 0.5);
            
              vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
              vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
              vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
              vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
              vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
              vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
              vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
              vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
            
              vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
              g000 *= norm0.x;
              g010 *= norm0.y;
              g100 *= norm0.z;
              g110 *= norm0.w;
              vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
              g001 *= norm1.x;
              g011 *= norm1.y;
              g101 *= norm1.z;
              g111 *= norm1.w;
            
              float n000 = dot(g000, Pf0);
              float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
              float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
              float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
              float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
              float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
              float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
              float n111 = dot(g111, Pf1);
            
              vec3 fade_xyz = fade(Pf0);
              vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
              vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
              float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
              return 2.2 * n_xyz;
            }
            ` + shader.vertexShader;
                /*shader.vertexShader =
                    shader.vertexShader.slice(0, shader.vertexShader.indexOf("#include <fog_vertex>") + 21) +
                    "\n fragPosition = vec3(position.x, position.y, position.z);" +
                    shader.vertexShader.slice(shader.vertexShader.indexOf("#include <fog_vertex>") + 21);
                shader.vertexShader = insertAt(shader.vertexShader, "#include <fog_vertex>", "\n gl_Position = projectionMatrix * modelViewMatrix * vec4(position + 0.15 * vec3(cnoise(vec3(position.x + stepX)), cnoise(vec3(position.y + stepY)), cnoise(vec3(position.z + stepZ))), 1.0);\nfragPosition = vec3(position.x, position.y, position.z);");
                shader.fragmentShader = "varying vec3 fragPosition;\nuniform vec3 shadeColor;\nuniform float stepX;\nuniform float stepY;\nuniform float stepZ;\n" + `
            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
            ` + shader.fragmentShader;
                let colorStr = "";
                if (this.color === "red") {
                    colorStr = `
                 if (seed < 0.1) {
                    lColor = vec3(1.0, 0, 0);
                } else if (seed < 0.4) {
                    lColor = vec3(1.0, mix(0.0, 0.7, (seed - 0.1) / 0.3), mix(0.0, 0.7, (seed - 0.1) / 0.3));
                } else {
                    lColor = vec3(1.0, 0.7, 0.7);
                }
                 `
                } else if (this.color === "green") {
                    colorStr = `
                if (seed < 0.1) {
                   lColor = vec3(0.0, 1.0, 0.0);
               } else if (seed < 0.4) {
                   lColor = vec3(mix(0.0, 0.7, (seed - 0.1) / 0.3), 1.0, mix(0.0, 0.7, (seed - 0.1) / 0.3));
               } else {
                   lColor = vec3(0.7, 1.0, 0.7);
               }
                `
                } else if (this.color === "blue") {
                    colorStr = `
                if (seed < 0.1) {
                   lColor = vec3(0.0, 0.0, 1.0);
               } else if (seed < 0.4) {
                   lColor = vec3(mix(0.0, 0.7, (seed - 0.1) / 0.3), mix(0.0, 0.7, (seed - 0.1) / 0.3), 1.0);
               } else {
                   lColor = vec3(0.7, 0.7, 1.0);
               }
                `
                }
                shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor = vec4( outgoingLight, diffuseColor.a );", `
            float noise5 = cnoise(fragPosition * 5.0 + vec3(stepX, stepY, stepZ));
            float seed =  noise5 + cnoise(fragPosition * 10.0 + vec3(stepX, stepY, stepZ)) * 0.5 + cnoise(fragPosition * 20.0 + vec3(stepX, stepY, stepZ)) * 0.2 + 0.2;
            vec3 lColor = vec3(0.0);` +
                    colorStr + "\n" +
                    `gl_FragColor = vec4(/*outgoingLight * 
        lColor, diffuseColor.a);
    `);
                return shader;
            }*/
        //mesh.material = material;
        this.mesh = mesh;
        this.mesh.lookAt(x + 5 * xVel, y + 5 * yVel, z + 5 * zVel);
        //mesh.rotation.x += Math.PI / 2;
        this.velocity = new THREE.Vector3(xVel, yVel, zVel);
        this.source = source;
    }
    update() {
        this.mesh.position.x += this.velocity.x * mainScene.timeScale;
        this.mesh.position.y += this.velocity.y * mainScene.timeScale;
        this.mesh.position.z += this.velocity.z * mainScene.timeScale;
        if (this.mesh.position.distanceTo(ORIGIN) > 1000) {
            this.destroy();
        }
    }
    destroy() {
        this.mesh.visible = false;
        mainScene.bullets.splice(mainScene.bullets.indexOf(this), 1);
        mainScene.third.scene.children.splice(mainScene.third.scene.children.indexOf(this.mesh), 1);
    }
}
Bullet.materials = {
    "red": new THREE.MeshPhongMaterial({ color: new THREE.Color(0xff6666) }),
    "green": new THREE.MeshPhongMaterial({ color: new THREE.Color(0x66ff66) }),
    "blue": new THREE.MeshPhongMaterial({ color: new THREE.Color(0x6666ff) }),
    "magenta": new THREE.MeshPhongMaterial({ color: new THREE.Color(0xff66ff) }),
    "yellow": new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffff66) })
}
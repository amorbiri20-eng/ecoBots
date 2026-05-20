// ==========================================================
// 🌌 ESCENA Y ENTORNO ATMOSFÉRICO (CIELO AZUL CYBERPUNK)
// ==========================================================
import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const scene = new THREE.Scene();
const explosions = [];

// --- NUEVO CIELO CON DEGRADADO AZUL ---
const canvasCielo = document.createElement('canvas');
canvasCielo.width = 1;
canvasCielo.height = 32;
const ctxCielo = canvasCielo.getContext('2d');
const gradient = ctxCielo.createLinearGradient(0, 0, 0, 32);
gradient.addColorStop(0, '#020208');   // Azul-negro profundo (Cenit/Arriba)
gradient.addColorStop(0.5, '#0a1432'); // Azul eléctrico oscuro (Medio)
gradient.addColorStop(1, '#00ffff');   // Cyan brillante neón (Horizonte/Abajo)
ctxCielo.fillStyle = gradient;
ctxCielo.fillRect(0, 0, 1, 32);

const backgroundTexture = new THREE.CanvasTexture(canvasCielo);
scene.background = backgroundTexture;

// Cambiamos la niebla a un tono azul/cyan para que se fusione con el horizonte
scene.fog = new THREE.Fog(0x0a1432, 30, 140);
// CAMARA
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// RENDER CON CONFIGURACIÓN DE ALTA CALIDAD
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;                  
renderer.shadowMap.type = THREE.PCFSoftShadowMap;    
renderer.toneMapping = THREE.ACESFilmicToneMapping;  
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ==========================================================
// 💡 ILUMINACIÓN GLOBAL
// ==========================================================
const ambientLight = new THREE.AmbientLight(0x4040a0, 0.9); 
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xffffff, 1.2); 
light.position.set(20, 40, 20); 
light.castShadow = true; 
light.shadow.mapSize.width = 2048; 
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
scene.add(light);

const ambient = new THREE.AmbientLight(0x0a1128, 2.0); 
scene.add(ambient);

const neonLight = new THREE.PointLight(0xff00ff, 3, 50);
neonLight.position.set(0, 5, 0);
scene.add(neonLight);

// ==========================================================
// 🛣️ SUELO DE CONCRETO GENERADO POR CÓDIGO (¡SIN IMÁGENES!)
// ==========================================================

// 1. Creamos un patrón de concreto usando un Canvas en memoria
const canvasConcreto = document.createElement('canvas');
canvasConcreto.width = 512;
canvasConcreto.height = 512;
const ctxConcreto = canvasConcreto.getContext('2d');

// Color base del concreto (Gris oscuro Cyberpunk)
ctxConcreto.fillStyle = '#1e1e24';
ctxConcreto.fillRect(0, 0, 512, 512);

// Añadimos el "ruido" poroso del concreto (puntos más claros y oscuros)
for (let i = 0; i < 10000; i++) {
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    let tamaño = Math.random() * 2;
    // Puntos gris claro para textura
    ctxConcreto.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.15)';
    ctxConcreto.fillRect(x, y, tamaño, tamaño);
}

// Dibujamos unas líneas finas de unión de las placas de concreto
ctxConcreto.strokeStyle = 'rgba(0, 0, 0, 0.4)';
ctxConcreto.lineWidth = 3;
ctxConcreto.strokeRect(0, 0, 512, 512);

// 2. Convertimos el canvas en una textura de Three.js
const concreteTexture = new THREE.CanvasTexture(canvasConcreto);
concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteTexture.repeat.set(20, 20); // Controla qué tan grandes se ven los bloques en el mapa

// 3. Creamos el material definitivo mate que recibe sombras
const floorMaterial = new THREE.MeshStandardMaterial({ 
    map: concreteTexture,
    roughness: 0.85, // Alto para que sea mate como el cemento real
    metalness: 0.05  // Casi nada de reflejo metálico
});

const floorGeometry = new THREE.PlaneGeometry(300, 300);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01; 
floor.receiveShadow = true; // 🔥 Crucial para ver las sombras de los robots
scene.add(floor);

// ==========================================================
// 👤 JUGADOR (INICIO INSTANTÁNEO INTEGRADO)
// ==========================================================
// Creamos un contenedor inmediato para que puedas disparar desde el segundo 0
let player = new THREE.Group(); 
player.position.set(0, 0, 0);
scene.add(player);

loader.load('models/player.glb', (gltf) => {
    const modeloVisual = gltf.scene;
    modeloVisual.traverse(n => { if(n.isMesh) n.castShadow = true; });
    player.add(modeloVisual); 
    console.log("Modelo del jugador cargado e inyectado");
  },
  undefined,
  (error) => console.error("Error cargando el modelo del jugador:", error)
);

// VARIABLES GLOBALES DE ESTADO
let vidaJugador = 100;
let energiaJugador = 100;
let contaminacion = 0;

// CONTADORES DE PARTIDA ACTUAL Y RÉCORDS
let robotsMatados = 0;
let basuraRecolectada = 0;

let recordRobots = localStorage.getItem('recordRobots') ? parseInt(localStorage.getItem('recordRobots')) : 0;
let recordBasura = localStorage.getItem('recordBasura') ? parseInt(localStorage.getItem('recordBasura')) : 0;

function inicializarMarcadores() {
  const elRecRobots = document.getElementById('record-robots');
  const elRecBasura = document.getElementById('record-basura');
  if (elRecRobots) elRecRobots.innerText = recordRobots;
  if (elRecBasura) elRecBasura.innerText = recordBasura;
}
window.addEventListener('DOMContentLoaded', inicializarMarcadores);

// CONTROLES DE TECLADO Y MOUSE
const keys = {};
let mouseX = 0;
let mouseY = 0;
let camaraAnguloX = 0; // Controla el giro de 360 grados de izquierda a derecha
let camaraAnguloY = 0.5; // Controla la altura de la cámara (arriba/abajo)
const radioCamara = 15; // Qué tan lejos está la cámara del robot

document.addEventListener('mousemove', (event) => {
  // Captura el movimiento puro del mouse incluso si el cursor está oculto
  camaraAnguloX -= event.movementX * 0.003; // Sensibilidad de izquierda a derecha
  camaraAnguloY += event.movementY * 0.003; // Sensibilidad de arriba a abajo

  // Límites para que la cámara no se ponga de cabeza (vista de pájaro o suelo)
  if (camaraAnguloY < 0.2) camaraAnguloY = 0.2;
  if (camaraAnguloY > 1.2) camaraAnguloY = 1.2;
});

// 🔥 BLOQUEO DEL MOUSE AUTOMÁTICO AL HACER CLIC EN EL JUEGO
renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
})
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ==========================================================
// ♻️ SISTEMA DE BASURA ELECTRÓNICA OPTIMIZADO (RESPAWN INCLUIDO)
// ==========================================================
const basuraObjects = [];
const modelosBasuraCargados = []; 

const listaBasuraGLB = [
  'models/basura1.glb', 'models/basura2.glb', 'models/basura3.glb',
  'models/basura4.glb', 'models/basura5.glb', 'models/basura6.glb', 'models/basura7.glb'
];

let modelosProcesados = 0;
listaBasuraGLB.forEach((ruta) => {
  loader.load(ruta, (gltf) => {
    const molde = gltf.scene;
    const escalaBasura = 0.1; 
    molde.scale.set(escalaBasura, escalaBasura, escalaBasura);
    
    molde.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material.metalness = 0.6;
          node.material.roughness = 0.4;
        }
      }
    });

    modelosBasuraCargados.push(molde);
    modelosProcesados++;

    if (modelosProcesados === listaBasuraGLB.length) {
      generarDistribucionBasura();
    }
  }, undefined, (error) => console.error("Error cargando molde base:", error));
});

function generarDistribucionBasura() {
  for (let i = 0; i < 30; i++) {
    const moldeAleatorio = modelosBasuraCargados[Math.floor(Math.random() * modelosBasuraCargados.length)];
    const clonBasura = moldeAleatorio.clone();
    clonBasura.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
    clonBasura.rotation.y = Math.random() * Math.PI * 2;
    scene.add(clonBasura);
    basuraObjects.push(clonBasura); 
  }
}

// ==========================================================
// 🏢 GENERACIÓN DE LA CIUDAD REAL
// ==========================================================
const misEdificiosGLB = [
  "models/building-sample-house-a.glb", "models/building-sample-house-b.glb",
  "models/building-sample-house-c.glb", "models/building-sample-tower-a.glb",
  "models/building-sample-tower-b.glb", "models/building-sample-tower-c.glb",
  "models/building-sample-tower-d.glb"
];

function construirCiudadReal() {
  for (let i = 0; i < 40; i++) {
    const modeloAleatorio = misEdificiosGLB[Math.floor(Math.random() * misEdificiosGLB.length)];
    loader.load(modeloAleatorio, (gltf) => {
      const edificio = gltf.scene;
      edificio.position.set(Math.random() * 160 - 80, 0, Math.random() * 160 - 80);
      edificio.scale.set(4, 4, 4); 
      edificio.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;
      edificio.traverse((node) => {
        if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
      });
      scene.add(edificio);
    }, undefined, (error) => console.error("Error cargando edificio:", error));
  }
}
construirCiudadReal();

// ==========================================================
// 🤖 ENEMIGOS (SISTEMA DE GENERACIÓN Y RESPAWN)
// ==========================================================
const enemies = []; 

function crearEnemy(x, z) {
  loader.load('models/enemy.glb', (gltf) => {
    const enemy = gltf.scene;
    enemy.position.set(x, 0, z);
    enemy.scale.set(1.5, 1.5, 1.5); 
    enemy.userData = { vida: 75 }; // Inicialización robusta de la vida del robot
    enemy.traverse((node) => {
      if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
    });
    scene.add(enemy);
    enemies.push(enemy); 
  }, undefined, (error) => console.error("Error cargando enemigo:", error));
}

for (let i = 0; i < 15; i++) {
  crearEnemy(Math.random() * 120 - 60, Math.random() * 120 - 60);
}

// ==========================================================
// 🔫 LÓGICA DE DISPAROS COMPLETA
// ==========================================================
const bullets = [];
const enemyBullets = [];

function shoot() {
  if (!player) return; 

  const geo = new THREE.SphereGeometry(0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Bala Amarilla
  const bullet = new THREE.Mesh(geo, mat);

  // La bala nace desde el pecho del robot
  bullet.position.copy(player.position);
  bullet.position.y += 1.2; 

  // Vector frontal nativo del modelo
  const direction = new THREE.Vector3(0, 0, 1); 
  
  // 🔥 CORRECCIÓN DE DIRECCIÓN INVERTIDA:
  // Le sumamos Math.PI (180 grados) a la rotación del personaje para que la bala 
  // salga hacia adelante de sus ojos y no hacia su espalda.
  direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y + Math.PI);
  direction.normalize();

  // Asignamos la velocidad final en esa dirección exacta
  bullet.userData = { velocity: direction.multiplyScalar(1.5) };

  scene.add(bullet);
  bullets.push(bullet);
  console.log("🔫 Bala corregida: disparando hacia el frente real del personaje");
}

function enemyShoot(enemy) {
  if (!player) return;

  const geo = new THREE.SphereGeometry(0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
  const bullet = new THREE.Mesh(geo, mat);

  bullet.position.copy(enemy.position);
  bullet.position.y += 1;

  const direction = new THREE.Vector3();
  direction.subVectors(player.position, enemy.position).normalize();
  bullet.userData = { velocity: direction.multiplyScalar(0.5) };

  scene.add(bullet);
  enemyBullets.push(bullet);
}

function movePlayer() {
  if (!player) return;

  const speed = 0.3;
  let dirX = 0;
  let dirZ = 0;

  // 🔥 CAPTURA LETRAS Y FLECHAS POR IGUAL
  if (keys['arrowup'] || keys['w']) dirZ += 1;    // Cambiado a + para ir al frente real
  if (keys['arrowdown'] || keys['s']) dirZ -= 1;  // Cambiado a - para ir atrás real
  if (keys['arrowleft'] || keys['a']) dirX -= 1;
  if (keys['arrowright'] || keys['d']) dirX += 1;

  if (dirX !== 0 && dirZ !== 0) {
    dirX *= 0.7071;
    dirZ *= 0.7071;
  }

  // Componentes de dirección basados en la vista de la cámara
  const forwardX = Math.sin(camaraAnguloX);
  const forwardZ = Math.cos(camaraAnguloX);

  if (dirX !== 0 || dirZ !== 0) {
    // Calculamos el movimiento exacto relativo a la pantalla
    player.position.x += (dirX * forwardZ - dirZ * forwardX) * speed;
    player.position.z += (dirX * -forwardX - dirZ * forwardZ) * speed;

    // El robot gira su cuerpo hacia donde lo estás moviendo (Teclas o Flechas)
    let anguloMovimiento = Math.atan2(dirX, dirZ) + camaraAnguloX;
    player.rotation.y = anguloMovimiento;
  } 

  // LÓGICA DE ENERGÍA
  const elBarraEnergia = document.getElementById('barra-energia');
  if (dirX !== 0 || dirZ !== 0) {
    energiaJugador -= 0.15;
    if (energiaJugador < 0) energiaJugador = 0;
  } else {
    energiaJugador += 0.25;
    if (energiaJugador > 100) energiaJugador = 100;
  }
  if (elBarraEnergia) elBarraEnergia.style.width = energiaJugador + '%';
}
 
function recogerBasura() {
  if (!player) return;

  for (let i = basuraObjects.length - 1; i >= 0; i--) {
    if (player.position.distanceTo(basuraObjects[i].position) < 2.5) {
      console.log("🔋 ¡E-Waste recolectado!");
      
      basuraRecolectada++;
      const elValBasura = document.getElementById('val-basura');
      if (elValBasura) elValBasura.innerText = basuraRecolectada;

      scene.remove(basuraObjects[i]);
      basuraObjects.splice(i, 1);

      vidaJugador += 15;
      if (vidaJugador > 100) vidaJugador = 100;

      const elBarraVida = document.getElementById('barra-vida');
      if (elBarraVida) elBarraVida.style.width = vidaJugador + '%';

      // Respawn dinámico de basura a los 3 segundos
      setTimeout(() => {
        if (modelosBasuraCargados.length > 0) {
          const moldeAleatorio = modelosBasuraCargados[Math.floor(Math.random() * modelosBasuraCargados.length)];
          const clonBasura = moldeAleatorio.clone();
          clonBasura.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
          clonBasura.rotation.y = Math.random() * Math.PI * 2;
          scene.add(clonBasura);
          basuraObjects.push(clonBasura); 
        }
      }, 3000);
    }
  }
}

function enemyAI() {
  if (!player) return;

  enemies.forEach(enemy => {
    const dist = player.position.distanceTo(enemy.position);
    
    if (dist < 20 && dist > 3) {
      enemy.position.lerp(player.position, 0.01);
      enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
    }
    
    if (dist < 20) {
      if (Math.random() < 0.02) { 
        enemyShoot(enemy);
      }
    }
  });
}

// CONTAMINACIÓN CIUDADANA
setInterval(() => {
  if (!player) return;
  contaminacion++;
  const elCont = document.getElementById('contaminacion');
  if (elCont) elCont.innerText = 'Contaminación: ' + contaminacion;
  
  if (contaminacion >= 100) {
    alert('La ciudad fue destruida por la e-waste');
    location.reload();
  }
}, 3000);

// ==========================================================
// 💥 CONTROL DE BALAS Y DETECCIÓN DE IMPACTOS / GAME OVER
// ==========================================================
function updateEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.position.add(b.userData.velocity);

    if (player) {
      const d = b.position.distanceTo(player.position);
      
      if (d < 2.0) {
        console.log("💥 ¡El jugador recibió daño enemigo!");
        
        vidaJugador -= 10; 
        if (vidaJugador < 0) vidaJugador = 0;

        const elBarraVida = document.getElementById('barra-vida');
        if (elBarraVida) elBarraVida.style.width = vidaJugador + '%';

        if (vidaJugador <= 0) {
          console.log("💀 GAME OVER");

          // GUARDAR RÉCORDS HISTÓRICOS EN LOCALSTORAGE
          // ✅ LÍNEA CORREGIDA:
if (robotsMatados > recordRobots) {
  localStorage.setItem('recordRobots', robotsMatados);
  recordRobots = robotsMatados;
}
          if (basuraRecolectada > recordBasura) {
            localStorage.setItem('recordBasura', basuraRecolectada);
            recordBasura = basuraRecolectada;
          }

          // Letrero de Game Over interactivo neón
          const cartel = document.createElement('div');
          cartel.innerHTML = `
            <div style="position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; 
                        background: rgba(10, 0, 0, 0.88); display: flex; flex-direction: column; 
                        justify-content: center; align-items: center; z-index: 1000; 
                        font-family: 'Courier New', monospace; color: #ff0055; text-shadow: 0 0 15px #ff0055;">
              <h1 style="font-size: 4rem; margin-bottom: 10px;">🔴 GAME OVER 🔴</h1>
              <p style="color: #00ffcc; font-size: 1.4rem;">Robots Destruidos: ${robotsMatados} | Reciclaje: ${basuraRecolectada}</p>
              <button onclick="window.location.reload()" style="margin-top: 20px; padding: 12px 25px; 
                               background: transparent; border: 2px solid #00ffcc; color: #00ffcc; 
                               font-weight: bold; cursor: pointer; box-shadow: 0 0 10px #00ffcc;">
                REINTENTAR COMPATIR MARCA
              </button>
            </div>
          `;
          document.body.appendChild(cartel);

          scene.remove(player);
          player = null; 
          
          scene.remove(b);
          enemyBullets.splice(i, 1);
          break;
        }

        scene.remove(b);
        enemyBullets.splice(i, 1);
        break; 
      }
    }

    if (b.position.length() > 300) {
      scene.remove(b);
      enemyBullets.splice(i, 1);
    }
  }
}

function updateBullets() {
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
    const bullet = bullets[bulletIndex];
    bullet.position.add(bullet.userData.velocity);
    let bulletRemoved = false;

    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      const dist = bullet.position.distanceTo(enemy.position);

      if (dist < 3.0) {
        enemy.userData.vida -= 25;

        scene.remove(bullet);
        bullets.splice(bulletIndex, 1);
        bulletRemoved = true;

        if (enemy.userData.vida <= 0) {
          console.log("🤖 ¡Robot EcoBot eliminado!");
          
          robotsMatados++;
          const elValRobots = document.getElementById('val-robots');
          if (elValRobots) elValRobots.innerText = robotsMatados;

          crearExplosion(enemy.position.x, enemy.position.y, enemy.position.z);
          scene.remove(enemy);          
          enemies.splice(enemyIndex, 1);

          // RESPAWN INFINITO DE ROBOTS REBELDES (En 4 segundos)
          setTimeout(() => {
            crearEnemy(Math.random() * 120 - 60, Math.random() * 120 - 60);
          }, 4000);
        }
        break; 
      }
    }

    if (!bulletRemoved && bullet.position.length() > 300) {
      scene.remove(bullet);
      bullets.splice(bulletIndex, 1);
    }
  }
}


// ==========================================================
// 🎥 CÁMARA EN TERCERA PERSONA 360° ÓRBITAL
// ==========================================================
function updateCamera() {
  if (player) {
    // 1. Calculamos la posición orbital de la cámara en 360 grados alrededor del robot
    camera.position.x = player.position.x + radioCamara * Math.sin(camaraAnguloX) * Math.cos(camaraAnguloY);
    camera.position.y = player.position.y + radioCamara * Math.sin(camaraAnguloY) + 2; // El +2 la eleva un poco
    camera.position.z = player.position.z + radioCamara * Math.cos(camaraAnguloX) * Math.cos(camaraAnguloY);

    // 2. Hacemos que la cámara mire fijamente al centro del jugador
    // Elevamos el punto de mira un poco (y + 1.5) para apuntar a su cabeza/pecho y no a sus pies
    const puntoMira = new THREE.Vector3(player.position.x, player.position.y + 1.5, player.position.z);
    camera.lookAt(puntoMira);
  } else {
    // Posición por defecto si el jugador muere
    camera.position.set(0, 25, 40);
    camera.lookAt(0, 0, 0);
  }
}

function crearExplosion(x, y, z) {
  const numeroParticulas = 20;
  const particulasMatriz = [];
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); 

  for (let i = 0; i < numeroParticulas; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y + 0.5, z);
    p.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random()) * 0.4, (Math.random() - 0.5) * 0.4),
      vida: 30 
    };
    scene.add(p);
    particulasMatriz.push(p);
  }
  explosions.push(particulasMatriz);
}

function updateExplosions() {
  for (let eIndex = explosions.length - 1; eIndex >= 0; eIndex--) {
    const grupo = explosions[eIndex];
    let grupoVivo = false;

    grupo.forEach(p => {
      if (p.userData.vida > 0) {
        p.position.add(p.userData.velocity);
        p.userData.velocity.y -= 0.01;
        p.scale.multiplyScalar(0.95);
        p.userData.vida--;
        grupoVivo = true;
      } else {
        scene.remove(p); 
      }
    });

    if (!grupoVivo) explosions.splice(eIndex, 1);
  }
}

// ==========================================================
// 🔄 LOOP DE ANIMACIÓN Y EVENTOS
// ==========================================================
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  updateCamera(); 

  recogerBasura();
  enemyAI();
  updateBullets();
  updateEnemyBullets();
  updateExplosions(); 
  
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



// DETECTAR CONTROLES TÁCTILES PARA CELULAR
if (window.innerWidth <= 1024) {
  const manager = nipplejs.create({
    zone: document.getElementById('zona-joystick'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' },
    color: '#00ffcc'
  });

  manager.on('move', (evt, data) => {
    if (data.vector) {
      keys['w'] = data.vector.y > 0.3;
      keys['s'] = data.vector.y < -0.3;
      keys['a'] = data.vector.x < -0.3;
      keys['d'] = data.vector.x > 0.3;
    }
  });

  manager.on('end', () => {
    keys['w'] = false; keys['s'] = false; keys['a'] = false; keys['d'] = false;
  });

  const btnDisparo = document.getElementById('boton-disparar-movil');
  if (btnDisparo) {
    btnDisparo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      shoot(); 
    });
  }
}
// ==========================================================
// 🖱️ CONTROL DE CÁMARA LIBRE CON CLIC DERECHO
// ==========================================================

// Desactivamos el menú contextual que sale en Windows al dar clic derecho
// para que no estorbe mientras giras la cámara
renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('mousemove', (event) => {
  // 🔥 LA CÁMARA SOLO GIRA SI EL JUGADOR ESTÁ VIVO Y DEJA PRESIONADO EL CLIC DERECHO (buttons === 2)
  if (player && event.buttons === 2) {
    // Usamos event.movementX/Y para un arrastre suave
    camaraAnguloX -= event.movementX * 0.005; // Sensibilidad horizontal
    camaraAnguloY += event.movementY * 0.005; // Sensibilidad vertical

    // Límites para evitar que la cámara gire verticalmente de cabeza
    if (camaraAnguloY < 0.2) camaraAnguloY = 0.2;
    if (camaraAnguloY > 1.2) camaraAnguloY = 1.2;
  }
});

// Cambiamos el disparo para que use el Clic Izquierdo común y corriente
document.addEventListener('mousedown', (e) => {
  // e.button === 0 es el Clic Izquierdo limpio (sin bloquear pantalla)
  if (e.button === 0 && player) {
    shoot();
  }
});
// ==========================================================
// 📱 CONTROL COMPATIBLE PARA CELULARES (TOUCH)
// ==========================================================

// Variable para recordar dónde empezó el dedo a tocar la pantalla
let touchInicioX = 0;
let touchInicioY = 0;

document.addEventListener('touchstart', (event) => {
  if (player && event.touches.length === 1) {
    touchInicioX = event.touches[0].clientX;
    touchInicioY = event.touches[0].clientY;
  }
}, { passive: true });

document.addEventListener('touchmove', (event) => {
  // Si arrastras un dedo por la pantalla, giras la cámara en 360°
  if (player && event.touches.length === 1) {
    let touchActualX = event.touches[0].clientX;
    let touchActualY = event.touches[0].clientY;

    // Calculamos cuánto se movió el dedo
    let deltaX = touchActualX - touchInicioX;
    let deltaY = touchActualY - touchInicioY;

    camaraAnguloX -= deltaX * 0.005; // Sensibilidad táctil horizontal
    camaraAnguloY += deltaY * 0.005; // Sensibilidad táctil vertical

    if (camaraAnguloY < 0.2) camaraAnguloY = 0.2;
    if (camaraAnguloY > 1.2) camaraAnguloY = 1.2;

    // Actualizamos el inicio para el siguiente fotograma
    touchInicioX = touchActualX;
    touchInicioY = touchActualY;
  }
}, { passive: true });
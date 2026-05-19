// ESCENA
import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const scene = new THREE.Scene();
const explosions = [];
scene.background = new THREE.Color(0x050510);

scene.fog = new THREE.Fog(0x00ff99, 20, 120);



// CAMARA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// RENDER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// RENDER CON CONFIGURACIÓN DE ALTA CALIDAD

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;                  // 🔥 ACTIVA LAS SOMBRAS
renderer.shadowMap.type = THREE.PCFSoftShadowMap;    // Sombras suaves y realistas
renderer.toneMapping = THREE.ACESFilmicToneMapping;  // Estilo cinematográfico (colores cyberpunk vibrantes)
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// ILUMINACIÓN MEJORADA
// Luz direccional (Simula la luna o un holograma gigante en el cielo que genera sombras)
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(30, 50, 20);
light.castShadow = true; 
// Optimizar la resolución de la sombra
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 150;
const d = 100; // Área que cubre la sombra
light.shadow.camera.left = -d;
light.shadow.camera.right = d;
light.shadow.camera.top = d;
light.shadow.camera.bottom = -d;
scene.add(light);

// Luz ambiental de la ciudad (Azul/Cyan Cyberpunk de relleno)
const ambient = new THREE.AmbientLight(0x0a1128, 2.0); 
scene.add(ambient);

// Añadir un punto de luz de neón cerca del centro como prueba (Luz Rosa/Fucsia)
const neonLight = new THREE.PointLight(0xff00ff, 3, 50);
neonLight.position.set(0, 5, 0);
scene.add(neonLight);
// SUELO
const floorGeometry = new THREE.PlaneGeometry(200, 200);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// JUGADOR
let player = null;

loader.load(
  'models/player.glb', 
  (gltf) => {
    player = gltf.scene;
    scene.add(player);
    console.log("Modelo del jugador cargado");
  },
  undefined,
  (error) => {
    console.error("Error cargando el modelo del jugador:", error);
  }
);

// VARIABLES
let vida = 100;
let energia = 100;
let basuraRecolectada = 0;
let contaminacion = 0;
let vidaJugador = 100;
let energiaJugador = 100;

// CONTROLES
const keys = {};
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

// ==========================================================
// 🔥 SISTEMA DE BASURA ELECTRÓNICA OPTIMIZADO (¡SIN LAG!)
// ==========================================================
const basuraObjects = [];
const modelosBasuraCargados = []; // Aquí guardaremos los 7 moldes originales

const listaBasuraGLB = [
  'models/basura1.glb',
  'models/basura2.glb',
  'models/basura3.glb',
  'models/basura4.glb',
  'models/basura5.glb',
  'models/basura6.glb',
  'models/basura7.glb'
];

// 1. Cargamos los 7 modelos en memoria de forma ultra rápida
let modelosProcesados = 0;

listaBasuraGLB.forEach((ruta, index) => {
  loader.load(ruta, (gltf) => {
    const molde = gltf.scene;
    
    // Dejamos el molde listo con su tamaño y sombras óptimas
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

    // Guardamos el molde en nuestra lista de memoria
    modelosBasuraCargados.push(molde);
    modelosProcesados++;

    // 2. CUANDO LOS 7 MOLDES ESTÉN LISTOS, CREAMOS LAS 30 COPIAS AL INSTANTE
    if (modelosProcesados === listaBasuraGLB.length) {
      generarDistribucionBasura();
    }
  }, 
  undefined, 
  (error) => console.error("Error cargando molde base:", ruta, error));
});

// Función que distribuye las 30 piezas usando clones (así no consume recursos)
function generarDistribucionBasura() {
  for (let i = 0; i < 30; i++) {
    // Elegimos uno de los moldes que ya tenemos descargados en memoria
    const moldeAleatorio = modelosBasuraCargados[Math.floor(Math.random() * modelosBasuraCargados.length)];
    
    // ¡EL TRUCO!: Clonamos el objeto en lugar de usar el loader.load de nuevo
    const clonBasura = moldeAleatorio.clone();
    
    // Le asignamos su posición al azar en el mapa
    let x = Math.random() * 100 - 50;
    let z = Math.random() * 100 - 50;
    clonBasura.position.set(x, 0, z);
    
    // Rotación única para que varíen visualmente
    clonBasura.rotation.y = Math.random() * Math.PI * 2;

    // Agregar a la escena y a la lista de recolección
    scene.add(clonBasura);
    basuraObjects.push(clonBasura); 
  }
  console.log("¡30 piezas de e-waste clonadas y distribuidas con éxito sin lag!");
}
// ==========================================
// 1. LISTA DE EDIFICIOS PREFABRICADOS
// ==========================================
const misEdificiosGLB = [
  "models/building-sample-house-a.glb",
  "models/building-sample-house-b.glb",
  "models/building-sample-house-c.glb",
  "models/building-sample-tower-a.glb",
  "models/building-sample-tower-b.glb",
  "models/building-sample-tower-c.glb",
  "models/building-sample-tower-d.glb"
];

// ==========================================
// 2. FUNCIÓN PARA CONSTRUIR LA CIUDAD
// ==========================================
function construirCiudadReal() {
  // El bucle "for" se encarga de repetir este proceso 40 veces de forma automática
  for (let i = 0; i < 40; i++) {
    
    // Selecciona una casa o torre al azar de la lista
    const modeloAleatorio = misEdificiosGLB[Math.floor(Math.random() * misEdificiosGLB.length)];
    
    // Cargamos el archivo .glb seleccionado
    loader.load(modeloAleatorio, (gltf) => {
      const edificio = gltf.scene;
      
      // Los distribuye de forma aleatoria por el mapa (X y Z)
      let x = Math.random() * 160 - 80;
      let z = Math.random() * 160 - 80;
      edificio.position.set(x, 0, z);
      
      // Escala de los edificios. Si se ven muy chicos o muy grandes en tu juego,
      // puedes cambiar estos números (ej. 1, 1, 1 o 3, 3, 3)
      edificio.scale.set(4, 4, 4); 
      
      // Los rota al azar en ángulos de 90 grados para que las calles tengan variedad
      edificio.rotation.y = (Math.floor(Math.random() * 4) * Math.PI) / 2;

      // Activa las sombras para que el juego se vea más realista
      edificio.traverse((node) => {
        if (node.isMesh) { 
          node.castShadow = true; 
          node.receiveShadow = true; 
        }
      });
      
      // Agrega el edificio finalmente a tu escena de Three.js
      scene.add(edificio);
    }, 
    undefined, 
    (error) => console.error("Error cargando:", modeloAleatorio, error));
  }
}

// ==========================================
// 3. EJECUCIÓN DE LA FUNCIÓN
// ==========================================
// Llamamos a la función una sola vez para que levante los 40 edificios
construirCiudadReal();


// ==========================================
// 1. LISTA DE ENEMIGOS EN JUEGO
// ==========================================
const enemies = []; // Array para guardar a los enemigos y que puedan moverse/disparar

// ==========================================
// 2. FUNCIÓN PARA CREAR CADA ENEMIGO (La que se había borrado)
// ==========================================
function crearEnemy(x, z) {
  // ⚠️ IMPORTANTE: Cambia "robot.glb" por el nombre exacto de tu archivo de enemigo
  loader.load('models/enemy.glb', (gltf) => {
    const enemy = gltf.scene;
    
    // Lo posicionamos usando los números aleatorios que manda el bucle
    enemy.position.set(x, 0, z);
    
    // Ajusta la escala si tu enemigo se ve muy gigante o muy pulga
    enemy.scale.set(1.5, 1.5, 1.5); 
    
    // Activamos sombras para el enemigo
    enemy.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    scene.add(enemy);
    enemies.push(enemy); // Lo guardamos en la lista de enemigos activos
  }, 
  undefined, 
  (error) => console.error("Error cargando enemigo:", error));
}

// ==========================================
// 3. BUCLE PARA CREAR LOS 5 ENEMIGOS
// ==========================================
for (let i = 0; i < 15; i++) {
  // Los esparce en un rango ideal para que los encuentres rápido
  let x = Math.random() * 120 - 60;
  let z = Math.random() * 120 - 60;
  
  crearEnemy(x, z);
}

// ==========================================
// 4. DISPAROS Y LOGICA (Tu código limpio)
// ==========================================
const bullets = [];
const enemyBullets = [];

function shoot() {
  if (!player) return; 

  const geo = new THREE.SphereGeometry(0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(geo, mat);

  bullet.position.copy(player.position);
  bullet.position.y += 1; // Eleva el disparo a la altura del arma/pecho

  const direction = new THREE.Vector3();
  player.getWorldDirection(direction); 

  bullet.userData = { velocity: direction.clone().multiplyScalar(0.8) };

  scene.add(bullet);
  bullets.push(bullet);
}

// Función de disparo enemigo
function enemyShoot(enemy) {
  if (!player) return;

  const geo = new THREE.SphereGeometry(0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Balas Rojas
  const bullet = new THREE.Mesh(geo, mat);

  bullet.position.copy(enemy.position);
  bullet.position.y += 1;

  const direction = new THREE.Vector3();
  direction.subVectors(player.position, enemy.position).normalize();

  bullet.userData = { velocity: direction.multiplyScalar(0.5) };

  scene.add(bullet);
  enemyBullets.push(bullet);
}
// MOVIMIENTO (Soporta WASD y Flechas)
function movePlayer() {
  if (!player) return;

  const speed = 0.3;
  let dirX = 0;
  let dirZ = 0;

  if (keys['arrowup'] || keys['w']) dirZ -= 1;
  if (keys['arrowdown'] || keys['s']) dirZ += 1;
  if (keys['arrowleft'] || keys['a']) dirX -= 1;
  if (keys['arrowright'] || keys['d']) dirX += 1;

  // Evitar diagonal más rápida
  if (dirX !== 0 && dirZ !== 0) {
    dirX *= 0.7071;
    dirZ *= 0.7071;
  }

  player.position.x += dirX * speed;
  player.position.z += dirZ * speed;

  // Rotar el modelo hacia donde camina
  if (dirX !== 0 || dirZ !== 0) {
    let angle = Math.atan2(dirX, dirZ);
    player.rotation.y = angle;
  }

  // 🔥 LÓGICA DE ENERGÍA (Gasta al moverse, recupera quieto)
  // ¡Ahora sí está dentro de la función y reconocerá dirX y dirZ!
  const elBarraEnergia = document.getElementById('barra-energia');
    
  if (dirX !== 0 || dirZ !== 0) {
    // Si se está moviendo, gasta energía lentamente
    energiaJugador -= 0.15;
    if (energiaJugador < 0) energiaJugador = 0;
  } else {
    // Si está quieto, se recarga sola
    energiaJugador += 0.25;
    if (energiaJugador > 100) energiaJugador = 100;
  }

  // Actualizar la barra azul en el HTML
  if (elBarraEnergia) {
    elBarraEnergia.style.width = energiaJugador + '%';
  }
} // ==========================================================
// ♻️ SISTEMA DE BASURA ELECTRÓNICA PROGRESIVA (RESPAWN)
// ==========================================================
function recogerBasura() {
  if (!player) return;

  for (let i = basuraObjects.length - 1; i >= 0; i--) {
    if (player.position.distanceTo(basuraObjects[i].position) < 2.5) {
      console.log("🔋 ¡E-Waste recolectado!");
      
      // 1. Borramos la basura de la pantalla
      scene.remove(basuraObjects[i]);
      basuraObjects.splice(i, 1);

      // 🔥 LÓGICA DE CURACIÓN: Sumar 15 HP sin pasar del 100%
      vidaJugador += 15;
      if (vidaJugador > 100) vidaJugador = 100;

      // Actualizar la barra visual verde en el HTML
      const elBarraVida = document.getElementById('barra-vida');
      if (elBarraVida) {
        elBarraVida.style.width = vidaJugador + '%';
      }

      // 2. Programar que aparezca nueva basura en 3 segundos
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
// IA ENEMIGOS
function enemyAI() {
  if (!player) return;

  enemies.forEach(enemy => {
    const dist = player.position.distanceTo(enemy.position);
    
    if (dist < 20 && dist > 3) {
      enemy.position.lerp(player.position, 0.01);
      enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
    }
    
    if (dist < 20) {
      if (Math.random() < 0.02) { // 2% de probabilidad por frame de disparar
        enemyShoot(enemy);
      }
    }

    if (dist < 3) {
      vida -= 0.1;
      const elVida = document.getElementById('vida');
      if (elVida) elVida.innerText = 'Vida: ' + Math.floor(vida);
    }
  });
}

// CONTAMINACION
setInterval(() => {
  contaminacion++;
  const elCont = document.getElementById('contaminacion');
  if (elCont) elCont.innerText = 'Contaminación: ' + contaminacion;
  
  if (contaminacion >= 100) {
    alert('La ciudad fue destruida por la e-waste');
    location.reload();
  }
}, 3000);

// ==========================================================
// 💥 ACTUALIZACIÓN DE BALAS ENEMIGAS (CORREGIDA AL 100%)
// ==========================================================
function updateEnemyBullets() {
  // 1. Creamos el ciclo para recorrer todas las balas de los robots
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    
    // Movemos la bala en cada cuadro de animación
    b.position.add(b.userData.velocity);

    // 2. Detectar si le pega al jugador
    if (player) {
      const d = b.position.distanceTo(player.position);
      
      if (d < 2.0) {
        console.log("💥 ¡El jugador recibió daño enemigo!");
        
        // RESTAR VIDA REAL
        vidaJugador -= 10; 
        if (vidaJugador < 0) vidaJugador = 0;

        // ACTUALIZAR LA BARRA VISUAL EN EL HTML
        const elBarraVida = document.getElementById('barra-vida');
        if (elBarraVida) {
          elBarraVida.style.width = vidaJugador + '%';
        }

        if (vidaJugador <= 0) {
          console.log("💀 GAME OVER - El robot fue destruido");
        }

        // Borramos la bala de la pantalla y de la lista
        scene.remove(b);
        enemyBullets.splice(i, 1);
        
        // Usamos break para salir de este condicional de forma segura
        break; 
      }
    }
    
    // 3. Limpieza optimizada usando 'b' (si la bala se va muy lejos del centro del mapa)
    if (b.position.length() > 300) {
      scene.remove(b);
      enemyBullets.splice(i, 1);
    }
  }
}
// ==========================================================
// 🔥 SISTEMA DE DETECCIÓN DE IMPACTO Y ELIMINACIÓN ENEMIGA
// ==========================================================
function updateBullets() {
  // Recorremos las balas del jugador desde la última hasta la primera
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
    const bullet = bullets[bulletIndex];
    
    // Mover la bala hacia adelante según la velocidad calculada al disparar
    bullet.position.add(bullet.userData.velocity);

    let bulletRemoved = false;

    // Revisar si esta bala golpea a alguno de los enemigos vivos
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      
      // Medimos la distancia exacta entre la bala y el centro del robot enemigo
      const dist = bullet.position.distanceTo(enemy.position);

      // AUMENTAMOS EL RADIO A 3.0: Si la bala entra en este rango, cuenta como golpe
      if (dist < 3.0) {
        
        // Restamos 25 de vida al enemigo (necesitarás 2 o 3 tiros para matarlo)
        if (enemy.userData && enemy.userData.vida !== undefined) {
          enemy.userData.vida -= 25;
          console.log("¡Le diste al robot! Vida restante: " + enemy.userData.vida);
        } else {
          // Por si las dudas el enemigo no tenía la variable inicializada
          enemy.userData = { vida: 25 }; 
          enemy.userData.vida -= 25;
        }

        // 1. Borramos la bala de la escena para que no lo atraviese y le pegue dos veces
        scene.remove(bullet);
        bullets.splice(bulletIndex, 1);
        bulletRemoved = true;

        // ¡SI EL ENEMIGO SE QUEDA SIN VIDA, LO ELIMINAMOS!
        if (enemy.userData.vida <= 0) {
          console.log("🤖 ¡Robot EcoBot eliminado por completo de la ciudad!");
          
          // 🔥 ¡AQUÍ ACTIVAMOS LA EXPLOSIÓN!: Usamos la posición del robot que muere
          crearExplosion(enemy.position.x, enemy.position.y, enemy.position.z);
          
          scene.remove(enemy);          
          enemies.splice(enemyIndex, 1); 
        }
        
        break; // Rompe el ciclo de enemigos porque esta bala ya impactó con uno
      }
    }

    // Si la bala no golpeó a nadie pero ya viajó muy lejos, la borramos para no trabar el juego
    if (!bulletRemoved && bullet.position.length() > 300) {
      scene.remove(bullet);
      bullets.splice(bulletIndex, 1);
    }
  }
}
// ACTUALIZAR CÁMARA (Lógica movida dentro de una función segura)
function updateCamera() {
  if (player) {
    camera.position.x = player.position.x + mouseX * 5;
    camera.position.y = player.position.y + 8;
    camera.position.z = player.position.z + 12;
    camera.lookAt(player.position);
  } else {
    // Posición por defecto mientras carga el modelo para evitar pantalla negra fija
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);
  }
}
// ==========================================================
// 🔥 EFECTO DE EXPLOSIÓN POR PARTICULAS
// ==========================================================
function crearExplosion(x, y, z) {
  const numeroParticulas = 20;
  const particulasMatriz = [];

  // Geometría y material brillante para los fragmentos
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // Naranja brillante

  for (let i = 0; i < numeroParticulas; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y + 0.5, z); // Aparecen a la altura del robot

    // Velocidad aleatoria en todas direcciones (X, Y, Z)
    p.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random()) * 0.4, // Hacia arriba
        (Math.random() - 0.5) * 0.4
      ),
      vida: 30 // Duración de la partícula en cuadros de animación
    };

    scene.add(p);
    particulasMatriz.push(p);
  }

  // Guardamos el grupo de partículas en nuestra lista global
  explosions.push(particulasMatriz);
}
function updateExplosions() {
  for (let eIndex = explosions.length - 1; eIndex >= 0; eIndex--) {
    const grupo = explosions[eIndex];
    let grupoVivo = false;

    grupo.forEach(p => {
      if (p.userData.vida > 0) {
        // Mover partícula
        p.position.add(p.userData.velocity);
        
        // Simular gravedad (caída lenta)
        p.userData.velocity.y -= 0.01;
        
        // Encoger la partícula poco a poco
        p.scale.multiplyScalar(0.95);
        
        // Restar tiempo de vida
        p.userData.vida--;
        grupoVivo = true;
      } else {
        scene.remove(p); // Quitar de la pantalla cuando muere
      }
    });

    // Si todas las partículas de esta explosión desaparecieron, borramos el grupo
    if (!grupoVivo) {
      explosions.splice(eIndex, 1);
    }
  }
}
// LOOP PRINCIPAL
function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  recogerBasura();
  enemyAI();
  updateBullets();
  updateEnemyBullets();
  updateExplosions(); // 🔥 AGREGA ESTA LÍNEA AQUÍ
  updateCamera(); 
  renderer.render(scene, camera);
}

animate();

// RESPONSIVE
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) { 
    shoot();
  }
});
// ==========================================================
// 📱 DETECTAR CONTROLES TÁCTILES PARA CELULAR
// ==========================================================
if (window.innerWidth <= 1024) {
  // 1. Crear el Joystick Visual
  const manager = nipplejs.create({
    zone: document.getElementById('zona-joystick'),
    mode: 'static',
    position: { left: '75px', bottom: '75px' },
    color: '#00ffcc'
  });

  // 2. Escuchar el movimiento del Joystick y pasarlo a las variables de movimiento
  manager.on('move', (evt, data) => {
    if (data.vector) {
      // Convertimos la inclinación de la palanca en direcciones -1 o 1
      keys['w'] = data.vector.y > 0.3;
      keys['s'] = data.vector.y < -0.3;
      keys['a'] = data.vector.x < -0.3;
      keys['d'] = data.vector.x > 0.3;
    }
  });

  // Cuando sueltas la palanca, el robot se detiene
  manager.on('end', () => {
    keys['w'] = false;
    keys['s'] = false;
    keys['a'] = false;
    keys['d'] = false;
  });

  // 3. Configurar botón de disparo físico táctil
  const btnDisparo = document.getElementById('boton-disparar-movil');
  if (btnDisparo) {
    btnDisparo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      shoot(); // Dispara al instante al tocar el botón
    });
  }
}
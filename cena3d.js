// Cena 3D do topo (Three.js): a TV do painel numa sala escura, tocando a gravação real da demonstração,
// com cupons girando em volta. Ao rolar, os cupons se espalham e a câmera entra na tela.
// Sem WebGL, ou com "reduzir movimento" ativo, a página fica com a imagem estática do topo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const hero = document.querySelector('.hero');
const forcar = /[?&]movimento=1\b/.test(location.search);
const reduzir = !forcar && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (hero && !reduzir) {
  try { iniciar(); } catch (e) { /* sem WebGL: fica a imagem estática */ }
}

function formaDoCupom(w, h, r) {
  // Retângulo com um entalhe em meia-lua de cada lado, como um cupom destacável.
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, -r);
  s.absarc(w / 2, 0, r, -Math.PI / 2, Math.PI / 2, true);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.lineTo(-w / 2, r);
  s.absarc(-w / 2, 0, r, Math.PI / 2, -Math.PI / 2, true);
  s.lineTo(-w / 2, -h / 2);
  return s;
}

function iniciar() {
  const canvas = document.createElement('canvas');
  canvas.className = 'cena3d';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  hero.prepend(canvas);

  const fundo = new THREE.Color('#050f16');
  const scene = new THREE.Scene();
  scene.background = fundo;
  scene.fog = new THREE.Fog(fundo, 9, 24);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 0.25, 10);

  scene.add(new THREE.HemisphereLight('#ffd9bf', '#050f16', 0.7));
  const chave = new THREE.DirectionalLight('#ffffff', 1.4);
  chave.position.set(3, 4, 6);
  scene.add(chave);
  const contra = new THREE.PointLight('#ff7a1f', 40, 22);
  contra.position.set(-5.5, 2.2, -2.5);
  scene.add(contra);
  const brilhoTela = new THREE.PointLight('#e9f3df', 14, 9);
  brilhoTela.position.set(0, 0, 2.2);
  scene.add(brilhoTela);

  const mundo = new THREE.Group();
  scene.add(mundo);

  // A TV: corpo arredondado e a tela com a gravação da demonstração (imagem até o vídeo começar).
  const tv = new THREE.Group();
  mundo.add(tv);
  const corpo = new THREE.Mesh(
    new RoundedBoxGeometry(4.86, 2.92, 0.3, 6, 0.09),
    new THREE.MeshStandardMaterial({ color: '#0d1a24', roughness: 0.42, metalness: 0.45 })
  );
  tv.add(corpo);
  const imagem = new THREE.TextureLoader().load('img/tela-resultado.jpg');
  imagem.colorSpace = THREE.SRGBColorSpace;
  const telaMat = new THREE.MeshBasicMaterial({ map: imagem, toneMapped: false });
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(4.56, 2.565), telaMat);
  tela.position.z = 0.152;
  tv.add(tela);

  const video = document.createElement('video');
  video.src = 'video/painel.webm';
  video.muted = true; video.loop = true; video.playsInline = true;
  video.setAttribute('playsinline', ''); video.preload = 'auto';
  video.addEventListener('playing', () => {
    const vt = new THREE.VideoTexture(video);
    vt.colorSpace = THREE.SRGBColorSpace;
    telaMat.map = vt;
    telaMat.needsUpdate = true;
  }, { once: true });
  video.play().catch(() => {});

  // Cupons: uma malha instanciada, cada um com órbita, giro e cor próprios.
  const pequeno = window.innerWidth < 700;
  const N = pequeno ? 34 : 72;
  const geo = new THREE.ExtrudeGeometry(formaDoCupom(1.1, 0.5, 0.09), { depth: 0.025, bevelEnabled: false });
  geo.center();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
  const cupons = new THREE.InstancedMesh(geo, mat, N);
  mundo.add(cupons);
  const cores = ['#ffffff', '#ff7a1f', '#ffbf94', '#ff7a1f', '#ffffff', '#ff8633'].map((c) => new THREE.Color(c));
  const dados = [];
  for (let i = 0; i < N; i++) {
    dados.push({
      ang: Math.random() * Math.PI * 2,
      raio: 3.6 + Math.random() * 4.2,
      y: (Math.random() - 0.5) * 5.6,
      z: (Math.random() - 0.5) * 2.5,
      vel: (0.04 + Math.random() * 0.09) * (Math.random() < 0.5 ? 1 : -1),
      rx: Math.random() * 6, ry: Math.random() * 6, rz: Math.random() * 6,
      gx: (Math.random() - 0.5) * 1.2, gy: (Math.random() - 0.5) * 1.4, gz: (Math.random() - 0.5) * 0.9,
      fase: Math.random() * 6,
      esc: 0.55 + Math.random() * 0.6
    });
    cupons.setColorAt(i, cores[i % cores.length]);
  }
  cupons.instanceColor.needsUpdate = true;
  const tmp = new THREE.Object3D();

  // Cursor: a sala inteira se inclina de leve.
  const alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    alvo.x = e.clientX / window.innerWidth - 0.5;
    alvo.y = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  // Mede o tamanho que o canvas realmente tem na tela. O topo muda de altura sem a janela mudar
  // (o cargo troca de texto, o cupom quebra linha, a barra do celular aparece), e o desenho
  // precisa acompanhar para a cena não ficar esticada ou amassada.
  const medir = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth)), h = Math.max(1, Math.round(canvas.clientHeight));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    tv.scale.setScalar(camera.aspect < 1 ? 0.62 : camera.aspect < 1.3 ? 0.8 : 1);
  };
  medir();
  new ResizeObserver(medir).observe(canvas);

  let visivel = true;
  new IntersectionObserver((es) => { visivel = es[0].isIntersecting; if (visivel) video.play().catch(() => {}); else video.pause(); }).observe(hero);

  const suave = (p) => p * p * (3 - 2 * p);
  const relogio = new THREE.Clock();
  let pronto = false;

  const quadro = () => {
    requestAnimationFrame(quadro);
    if (!visivel || document.hidden) return;
    const dt = Math.min(relogio.getDelta(), 0.05);
    const t = relogio.elapsedTime;
    const p = Math.min(Math.max(window.__heroP || 0, 0), 1);
    const q = suave(p);

    atual.x += (alvo.x - atual.x) * 0.05;
    atual.y += (alvo.y - atual.y) * 0.05;
    mundo.rotation.y = atual.x * 0.35;
    mundo.rotation.x = atual.y * 0.14;

    // Rolagem: a câmera entra na tela, a TV encara a câmera e os cupons se espalham.
    const fim = camera.aspect < 1 ? 7.2 : 4.3;
    camera.position.z = 10 + (fim - 10) * q;
    camera.position.y = 0.25 * (1 - q);
    camera.lookAt(0, 0, 0);
    tv.rotation.y = -0.2 * (1 - q) + Math.sin(t * 0.35) * 0.04 * (1 - q);
    tv.rotation.x = Math.sin(t * 0.5) * 0.025 * (1 - q);
    tv.position.y = Math.sin(t * 0.8) * 0.06 * (1 - q);

    const acelera = 1 + q * 7;
    const abre = 1 + q * 1.4;
    for (let i = 0; i < N; i++) {
      const d = dados[i];
      d.ang += d.vel * dt * acelera;
      d.rx += d.gx * dt * acelera; d.ry += d.gy * dt * acelera; d.rz += d.gz * dt;
      tmp.position.set(
        Math.cos(d.ang) * d.raio * abre,
        d.y * (1 + q * 0.6) + Math.sin(t * 0.7 + d.fase) * 0.18,
        Math.sin(d.ang) * d.raio * 0.5 * abre + d.z - 1.2
      );
      tmp.rotation.set(d.rx, d.ry, d.rz);
      tmp.scale.setScalar(d.esc);
      tmp.updateMatrix();
      cupons.setMatrixAt(i, tmp.matrix);
    }
    cupons.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
    if (!pronto) { pronto = true; hero.classList.add('tem-3d'); }
  };
  quadro();
}

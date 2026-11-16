// Comportamento do portfólio: barra, cursor, história do painel, simulação de RLS, trilho de projetos e cenas de rolagem.
(function () {
  'use strict';

  var root = document.documentElement;
  // ?movimento=1 liga as animações mesmo com "reduzir movimento" ativo no sistema (útil para testar).
  var forcar = /[?&]movimento=1\b/.test(location.search);
  var reduce = forcar ? { matches: false } : window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var mouseFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!reduce.matches) root.classList.add('motion');

  // Barra fixa: aparece depois que o topo sai de vista.
  var bar = document.getElementById('bar');
  var hero = document.getElementById('topo');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('on', !entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  } else if (bar) {
    bar.classList.add('on');
  }

  // Barra de progresso: só quando o navegador não tem animation-timeline.
  var progresso = document.getElementById('progresso');
  if (progresso && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var medirProgresso = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progresso.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    };
    window.addEventListener('scroll', medirProgresso, { passive: true });
    window.addEventListener('resize', medirProgresso);
    medirProgresso();
  }

  // História presa: cada passo troca a tela da TV.
  var shots = document.querySelectorAll('.shot');
  var steps = document.querySelectorAll('.step');
  if (shots.length && steps.length && 'IntersectionObserver' in window) {
    var show = function (i) {
      shots.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) show(Number(e.target.getAttribute('data-shot')));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  // Quem vê o quê: o banco devolve só as regionais liberadas para o perfil.
  var perfis = {
    todas: { nome: 'visão da diretoria', regionais: null },
    litoral: { nome: 'visão da coordenação do litoral', regionais: ['costa-azul', 'costa-dourada'] },
    serra: { nome: 'visão do gerente da Serra Alta', regionais: ['serra-alta'] },
    nenhuma: { nome: 'pedido de acesso em análise', regionais: [] }
  };
  var form = document.getElementById('perfis');
  var rows = document.querySelectorAll('#rls-body tr');
  var cap = document.getElementById('rls-cap');
  var count = document.getElementById('rls-count');
  var empty = document.getElementById('rls-empty');
  if (form && rows.length) {
    var aplicar = function (chave) {
      var perfil = perfis[chave] || perfis.todas;
      var vistas = 0;
      rows.forEach(function (tr) {
        var ok = perfil.regionais === null || perfil.regionais.indexOf(tr.getAttribute('data-r')) !== -1;
        tr.classList.toggle('is-out', !ok);
        tr.classList.toggle('is-new', ok && perfil.regionais !== null);
        if (ok) vistas++;
      });
      cap.textContent = 'Cupons por regional, ' + perfil.nome;
      count.textContent = vistas + ' de ' + rows.length;
      empty.hidden = vistas !== 0;
      if (hasGsap && !reduce.matches) {
        gsap.fromTo('#rls-body tr:not(.is-out)', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out', overwrite: true });
      }
    };
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'perfil') aplicar(e.target.value);
    });
  }

  // Entradas: título, texto e imagem de cada bloco sobem em sequência, uma vez.
  var blocks = document.querySelectorAll('[data-rise], [data-float]');
  if (!reduce.matches && 'IntersectionObserver' in window) {
    blocks.forEach(function (b) {
      if (!b.children.length) b.classList.add('solo');
      Array.prototype.forEach.call(b.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var rise = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rise.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    blocks.forEach(function (b) { rise.observe(b); });
  } else {
    blocks.forEach(function (b) { b.classList.add('in'); });
  }
  // Velocidade da rolagem, compartilhada pelo campo de pontos e pela faixa.
  var rolagem = { y: window.scrollY, v: 0, dir: 1 };
  var medirRolagem = function () {
    var y = window.scrollY, d = y - rolagem.y;
    rolagem.y = y;
    if (d) rolagem.dir = d > 0 ? 1 : -1;
    rolagem.v = rolagem.v * 0.88 + d * 0.12;
  };

  // Campo de pontos atrás das áreas escuras: ondula com a rolagem e abre caminho para o cursor.
  var campo = document.getElementById('campo');
  if (campo && campo.getContext) {
    var cx = campo.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, gap = 30;
    var cursor = { x: -9999, y: -9999, k: 0 };
    var tinta = getComputedStyle(root).getPropertyValue('--ink').trim() || '#f3efe8';
    var laranja = getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff7a1f';
    var medir = function () {
      W = window.innerWidth; H = window.innerHeight;
      campo.width = Math.round(W * dpr); campo.height = Math.round(H * dpr);
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? 24 : 30;
    };
    var pintar = function (t) {
      cx.clearRect(0, 0, W, H);
      cx.fillStyle = tinta;
      var desloc = (window.scrollY * 0.35) % gap;
      var amp = 1.6 + Math.min(Math.abs(rolagem.v), 60) * 0.18;
      var R = 170, perto = [];
      cx.globalAlpha = 0.16;
      cx.beginPath();
      for (var y = -gap; y < H + gap; y += gap) {
        var py = y - desloc;
        var fase = (y + Math.floor(window.scrollY * 0.35 / gap) * gap) * 0.009;
        for (var x = gap / 2; x < W; x += gap) {
          var onda = t ? Math.sin(t * 0.0009 + x * 0.011 + fase) * amp : 0;
          var dx = x - cursor.x, dy = py - cursor.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < R) { perto.push([x, py + onda, dx, dy, d]); continue; }
          cx.moveTo(x + 1.5, py + onda);
          cx.arc(x, py + onda, 1.5, 0, 6.2832);
        }
      }
      cx.fill();
      // Pontos perto do cursor: são empurrados para fora, crescem e acendem em laranja.
      cx.fillStyle = laranja;
      for (var i = 0; i < perto.length; i++) {
        var p = perto[i], k = (1 - p[4] / R) * cursor.k, empurra = k * k * 28;
        var nx = p[0] + (p[4] ? p[2] / p[4] * empurra : 0);
        var ny = p[1] + (p[4] ? p[3] / p[4] * empurra : 0);
        cx.globalAlpha = 0.16 + k * 0.7;
        cx.beginPath();
        cx.arc(nx, ny, 1.5 + k * 2.6, 0, 6.2832);
        cx.fill();
      }
      cx.globalAlpha = 1;
    };
    medir();
    window.addEventListener('resize', medir);
    if (reduce.matches) {
      // Sem movimento automático: o campo fica parado e só acompanha a rolagem.
      var pedido = false;
      var estatico = function () { pedido = false; pintar(0); };
      window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(estatico); } }, { passive: true });
      window.addEventListener('resize', estatico);
      estatico();
    } else {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        cursor.x = e.clientX; cursor.y = e.clientY;
      }, { passive: true });
      document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) cursor.x = cursor.y = -9999; });
      var quadro = function (t) {
        medirRolagem();
        cursor.k += ((cursor.x > -9000 ? 1 : 0) - cursor.k) * 0.08;
        if (!document.hidden) pintar(t);
        requestAnimationFrame(quadro);
      };
      requestAnimationFrame(quadro);
    }
  }

  // Faixa de nomes: corre de lado, acelera e inclina com a rolagem, e troca de sentido junto com ela.
  var faixas = document.querySelectorAll('.ribbon-row');
  if (faixas.length && !reduce.matches) {
    var linhas = Array.prototype.map.call(faixas, function (row) {
      var trilho = row.querySelector('.ribbon-track');
      trilho.innerHTML += trilho.innerHTML; // conteúdo duplicado para o laço não ter emenda
      return { trilho: trilho, x: 0, sentido: Number(row.getAttribute('data-dir')) || -1, metade: 0 };
    });
    var medirFaixas = function () { linhas.forEach(function (l) { l.metade = l.trilho.scrollWidth / 2; }); };
    medirFaixas();
    window.addEventListener('resize', medirFaixas);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirFaixas);
    var antes = performance.now();
    var andar = function (agora) {
      var dt = Math.min(agora - antes, 64) / 1000;
      antes = agora;
      if (!campo) medirRolagem();
      var extra = Math.min(Math.abs(rolagem.v), 80) * 9;
      var inclina = Math.max(-9, Math.min(9, rolagem.v * -0.35));
      linhas.forEach(function (l) {
        if (!l.metade) return;
        l.x += l.sentido * rolagem.dir * (60 + extra) * dt;
        if (l.x <= -l.metade) l.x += l.metade;
        if (l.x > 0) l.x -= l.metade;
        l.trilho.style.transform = 'translate3d(' + l.x.toFixed(1) + 'px,0,0) skewX(' + inclina.toFixed(2) + 'deg)';
      });
      requestAnimationFrame(andar);
    };
    requestAnimationFrame(andar);
  }

  // Vídeos das telas: tocam só quando aparecem; o botão pausa e retoma. Com "reduzir movimento", ficam parados no pôster.
  document.querySelectorAll('.vid').forEach(function (fig) {
    var v = fig.querySelector('video'), btn = fig.querySelector('.vid-btn');
    if (!v || !btn) return;
    var pausadoPeloUsuario = reduce.matches;
    var rotulo = function () { btn.textContent = v.paused ? 'Reproduzir' : 'Pausar'; };
    v.addEventListener('play', rotulo); v.addEventListener('pause', rotulo);
    btn.addEventListener('click', function () {
      if (v.paused) { pausadoPeloUsuario = false; v.play(); } else { pausadoPeloUsuario = true; v.pause(); }
    });
    rotulo();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting && !pausadoPeloUsuario) { v.preload = 'auto'; v.play().catch(function () {}); }
          else if (!e.isIntersecting) v.pause();
        });
      }, { threshold: 0.35 }).observe(fig);
    }
  });

  // Relógio de Charqueadas na barra.
  var relogio = document.getElementById('relogio');
  if (relogio && window.Intl) {
    var hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    var tic = function () { relogio.textContent = 'Charqueadas, ' + hora.format(new Date()); };
    tic();
    setInterval(tic, 15000);
  }

  // Links da barra "decodificam" ao passar o mouse.
  var simbolos = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%$#';
  var decodificar = function (el) {
    if (el._decod) return;
    var final = el.textContent, quadro = 0, total = 14;
    el._decod = true;
    var passo = function () {
      quadro++;
      var pronto = Math.floor(final.length * quadro / total);
      el.textContent = final.split('').map(function (ch, i) {
        return i < pronto || ch === ' ' ? ch : simbolos[(Math.random() * simbolos.length) | 0];
      }).join('');
      if (quadro < total) requestAnimationFrame(passo); else { el.textContent = final; el._decod = false; }
    };
    requestAnimationFrame(passo);
  };
  if (!reduce.matches && mouseFino) {
    document.querySelectorAll('.bar nav a:not(.btn), .wordmark, .hero-links .tlink').forEach(function (a) {
      a.addEventListener('mouseenter', function () { decodificar(a); });
    });
  }

  if (!reduce.matches && mouseFino) {
    // Cursor próprio: um ponto no lugar da seta e um anel que vem atrás e cresce sobre links.
    var cursorEl = document.getElementById('cursor');
    if (cursorEl) {
      root.classList.add('cursor-on');
      var dot = cursorEl.querySelector('.cursor-dot'), ring = cursorEl.querySelector('.cursor-ring');
      var mira = { x: -100, y: -100 }, anel = { x: -100, y: -100 }, ativo = false;
      var seguir = function () {
        anel.x += (mira.x - anel.x) * 0.18;
        anel.y += (mira.y - anel.y) * 0.18;
        ring.style.transform = 'translate3d(' + anel.x.toFixed(1) + 'px,' + anel.y.toFixed(1) + 'px,0)';
        if (Math.abs(mira.x - anel.x) > 0.1 || Math.abs(mira.y - anel.y) > 0.1) requestAnimationFrame(seguir); else ativo = false;
      };
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        mira.x = e.clientX; mira.y = e.clientY;
        dot.style.transform = 'translate3d(' + mira.x + 'px,' + mira.y + 'px,0)';
        if (!ativo) { ativo = true; requestAnimationFrame(seguir); }
        cursorEl.classList.toggle('is-link', !!(e.target.closest && e.target.closest('a, button, label, [data-tilt]')));
      }, { passive: true });
      window.addEventListener('pointerdown', function () { cursorEl.classList.add('is-down'); });
      window.addEventListener('pointerup', function () { cursorEl.classList.remove('is-down'); });
      document.addEventListener('mouseout', function (e) { if (!e.relatedTarget) cursorEl.style.opacity = 0; });
      document.addEventListener('mouseover', function () { cursorEl.style.opacity = 1; });
    }

    // Luz que acompanha o cursor nas faixas escuras.
    document.querySelectorAll('.work, .ledger, .about, .p-ink').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--mx', '-999px'); });
    });

    // O nome do topo acompanha o cursor de leve, em paralaxe.
    var heroMain = document.querySelector('[data-parallax]');
    if (heroMain) {
      var pAlvo = { x: 0, y: 0 }, pAtual = { x: 0, y: 0 }, pRodando = false;
      var mover = function () {
        pAtual.x += (pAlvo.x - pAtual.x) * 0.06;
        pAtual.y += (pAlvo.y - pAtual.y) * 0.06;
        heroMain.style.setProperty('--px', pAtual.x.toFixed(2) + 'px');
        heroMain.style.setProperty('--py', pAtual.y.toFixed(2) + 'px');
        heroMain.style.translate = pAtual.x.toFixed(2) + 'px ' + pAtual.y.toFixed(2) + 'px';
        if (Math.abs(pAlvo.x - pAtual.x) > 0.05 || Math.abs(pAlvo.y - pAtual.y) > 0.05) requestAnimationFrame(mover); else pRodando = false;
      };
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || window.scrollY > window.innerHeight) return;
        pAlvo.x = (e.clientX / window.innerWidth - 0.5) * -28;
        pAlvo.y = (e.clientY / window.innerHeight - 0.5) * -18;
        if (!pRodando) { pRodando = true; requestAnimationFrame(mover); }
      }, { passive: true });
    }

    // Imagens e telas inclinam na direção do cursor.
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var alvo = { x: 0, y: 0 }, atual = { x: 0, y: 0 }, rodando = false;
      var girar = function () {
        atual.x += (alvo.x - atual.x) * 0.12;
        atual.y += (alvo.y - atual.y) * 0.12;
        el.style.transform = 'perspective(1100px) rotateX(' + atual.y.toFixed(2) + 'deg) rotateY(' + atual.x.toFixed(2) + 'deg)';
        if (Math.abs(alvo.x - atual.x) > 0.02 || Math.abs(alvo.y - atual.y) > 0.02) requestAnimationFrame(girar);
        else rodando = false;
      };
      var ligar = function () { if (!rodando) { rodando = true; requestAnimationFrame(girar); } };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        alvo.x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        alvo.y = -((e.clientY - r.top) / r.height - 0.5) * 8;
        ligar();
      });
      el.addEventListener('pointerleave', function () { alvo.x = 0; alvo.y = 0; ligar(); });
    });

    // Botões magnéticos: puxam levemente na direção do cursor.
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  if (!hasGsap || reduce.matches) return;

  // ---------- Cenas de rolagem (GSAP ScrollTrigger) ----------
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('gsap-on');

  // Rolagem suave só com mouse ou trackpad; no toque fica a rolagem nativa.
  var lenis = null;
  if (window.Lenis && window.matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  // Âncoras: rolagem suave até a seção; dentro do trilho horizontal, até a posição que mostra o painel.
  var alvoDoTrilho = null; // função definida na cena do trilho
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      // Ctrl/Cmd/Shift-clique e botão do meio seguem o comportamento normal do navegador.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var id = a.getAttribute('href');
      var alvo = id.length > 1 && document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      var destino = (alvoDoTrilho && alvoDoTrilho(alvo));
      if (destino === null || destino === undefined) destino = alvo;
      var desloc = id === '#topo' ? 0 : -64;
      if (lenis) lenis.scrollTo(destino, { offset: typeof destino === 'number' ? 0 : desloc });
      else window.scrollTo({ top: typeof destino === 'number' ? destino : alvo.getBoundingClientRect().top + window.scrollY + desloc, behavior: 'smooth' });
      history.replaceState(null, '', id);
      alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
    });
  });

  var mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 900px)', phone: '(max-width: 899px)', trilho: '(min-width: 1024px) and (min-height: 560px)' }, function (ctx) {
    var desktop = ctx.conditions.desktop;
    var trilho = ctx.conditions.trilho;

    // 1. Topo: enquanto sai de cena, o nome recua e some e a câmera da cena 3D entra na tela (progresso em window.__heroP).
    var topo = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6, onUpdate: function (s) { window.__heroP = s.progress; } }
    });
    topo
      .to('.hero-main', { yPercent: 35, scale: 0.9, autoAlpha: 0, ease: 'power1.in', duration: 1 }, 0)
      .to('.hero-foot', { autoAlpha: 0, y: 40, ease: 'power1.in', duration: 0.5 }, 0.1)
      .fromTo('.hero-bg', { scale: 1.16 }, { scale: 1, ease: 'none', duration: 1 }, 0);

    // 2. A TV se endireita e chega para perto; a barra mostra em qual passo a história está.
    gsap.fromTo('.tv',
      { scale: desktop ? 0.78 : 0.9, rotateX: desktop ? 22 : 10, y: 60, transformPerspective: 1400 },
      { scale: 1, rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'top 25%', scrub: 0.6 } });
    var barras = gsap.utils.toArray('.tv-progress i');
    steps.forEach(function (s, i) {
      if (!barras[i]) return;
      gsap.fromTo(barras[i], { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    });

    // 3. O caminho do dado: um cupom percorre as cinco etapas e acende a etapa em que está.
    var etapas = gsap.utils.toArray('.flow li');
    var chip = document.querySelector('.chip');
    var trilha = document.querySelector('.flow-track');
    if (desktop && chip && trilha && etapas.length) {
      var marcar = function (p) {
        var k = Math.min(etapas.length - 1, Math.floor(p * etapas.length));
        etapas.forEach(function (li, j) { li.classList.toggle('is-at', j === k); });
      };
      var fluxo = gsap.timeline({
        scrollTrigger: { trigger: '.build', start: 'top 22%', end: '+=140%', pin: true, scrub: 0.6, anticipatePin: 1 }
      });
      fluxo
        .from(etapas, { y: 48, opacity: 0, stagger: 0.12, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo(chip, { x: 0 }, {
          x: function () { return trilha.offsetWidth - chip.offsetWidth; },
          ease: 'none', duration: 1.4,
          onUpdate: function () { marcar(this.progress()); }
        }, 0.35);
    } else {
      gsap.from(etapas, { y: 40, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.flow', start: 'top 85%', once: true } });
    }

    // 4. Trilho de projetos: preso à tela, a rolagem vertical vira deslocamento lateral.
    var rail = document.getElementById('rail');
    var track = document.getElementById('track');
    var paineis = gsap.utils.toArray('.panel');
    if (trilho && rail && track && paineis.length > 1) {
      root.classList.add('rail-h');
      var distancia = function () { return track.scrollWidth - window.innerWidth; };
      var corrida = gsap.to(track, {
        x: function () { return -distancia(); },
        ease: 'none',
        scrollTrigger: {
          trigger: rail, start: 'top top', end: function () { return '+=' + Math.round(distancia() * 0.75); },
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true
        }
      });
      // Dentro de cada painel, a figura anda em ritmo próprio e o título entra do lado.
      paineis.forEach(function (p) {
        var fig = p.querySelector('[data-float]');
        if (fig) gsap.fromTo(fig, { xPercent: 7 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: corrida, start: 'left right', end: 'right left', scrub: true } });
        var t = p.querySelector('.panel-t');
        if (t) gsap.fromTo(t, { xPercent: 12, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power2.out', duration: 0.6, scrollTrigger: { trigger: p, containerAnimation: corrida, start: 'left 70%', toggleActions: 'play none none reverse' } });
      });
      // Âncora para um painel: a posição vertical em que ele fica inteiro na tela.
      alvoDoTrilho = function (el) {
        var p = el.closest && el.closest('.panel');
        if (!p) return null;
        var st = corrida.scrollTrigger;
        var i = paineis.indexOf(p);
        if (i < 0) return null;
        var fracao = p.offsetLeft / Math.max(1, distancia());
        return st.start + Math.min(1, fracao) * (st.end - st.start);
      };
    } else {
      alvoDoTrilho = null;
      paineis.forEach(function (p) {
        var fig = p.querySelector('[data-float]');
        if (fig && desktop) gsap.fromTo(fig, { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }

    // 5. Trajetória: a linha se desenha com a rolagem.
    var linha = document.querySelector('.rail-line b');
    if (linha) {
      gsap.fromTo(linha, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: 0.4 } });
    }

    // 6. Charqueadas: a foto aérea recua enquanto o cartão de contato chega.
    gsap.fromTo('.contact-bg', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: desktop ? 'bottom bottom' : 'center center', scrub: true } });

    // 7. Rodapé: o e-mail sobe de trás da linha de base.
    gsap.from('.back-mail .li', { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.11, scrollTrigger: { trigger: '.back-mail', start: 'top 85%', once: true } });

    return function () { root.classList.remove('rail-h'); };
  });

  // Títulos (criados depois das cenas presas, para medir já com o espaço dos pins): cada palavra sobe da sua própria máscara. O texto inteiro fica no aria-label.
  var dividir = function (el) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.classList.add('split');
    el.innerHTML = texto.split(/\s+/).map(function (p) {
      return '<span class="w" aria-hidden="true"><span class="wi">' + p + '</span></span>';
    }).join(' ');
    return el.querySelectorAll('.wi');
  };
  document.querySelectorAll('.h-head:not(.panel-t), .ledger-t span').forEach(function (el) {
    var palavras = dividir(el);
    if (el.parentElement && el.parentElement.hasAttribute('data-rise')) {
      el.style.opacity = 1; el.style.transform = 'none'; el.style.transition = 'none';
    }
    gsap.from(palavras, {
      yPercent: 115, rotate: 6, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true, refreshPriority: -1 }
    });
  });

  // Os nomes dos projetos aparecem um a um.
  var nomes = document.querySelectorAll('.names > *');
  if (nomes.length) {
    gsap.from(nomes, { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.names', start: 'top 85%', once: true } });
  }

  // Entrada: o nome sobe de trás da linha de base, depois o resto acende.
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero-name .li', { yPercent: 110, duration: 1.1, stagger: 0.11 }, 0.1)
    .from('.hero-role', { y: 24, autoAlpha: 0, duration: 0.8 }, 0.7)
    .from('.hero-foot > *', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.9);

  // Contadores: o número sobe até o valor quando aparece. A largura fica reservada para a página não pular.
  document.querySelectorAll('.odo').forEach(function (el) {
    var alvo = el.getAttribute('data-n');
    var fim = Number(alvo.replace(/\D/g, ''));
    var milhar = alvo.indexOf('.') !== -1;
    var formatar = function (v) { v = Math.round(v); return milhar ? v.toLocaleString('pt-BR') : String(v); };
    el.style.setProperty('--w', alvo.length + 'ch');
    el.setAttribute('aria-label', alvo);
    var obj = { v: 0 };
    el.textContent = formatar(0);
    gsap.to(obj, {
      v: fim, duration: 1.8, ease: 'expo.out',
      onUpdate: function () { el.textContent = formatar(obj.v); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true, refreshPriority: -1 }
    });
  });

  var refazer = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refazer);
  window.addEventListener('load', refazer);
})();

// Comportamento do portfólio: barra, história do painel, simulação de RLS, entradas e cenas de rolagem.
(function () {
  'use strict';

  var root = document.documentElement;
  // ?movimento=1 liga as animações mesmo com "reduzir movimento" ativo no sistema (útil para testar).
  var forcar = /[?&]movimento=1\b/.test(location.search);
  var reduce = forcar ? { matches: false } : window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (!reduce.matches) root.classList.add('motion');

  // Barra fixa: aparece depois que o cupom do topo sai de vista.
  var bar = document.getElementById('bar');
  var hero = document.getElementById('topo');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('on', !entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(hero);
  } else if (bar) {
    bar.classList.add('on');
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
  var blocks = document.querySelectorAll('[data-rise]');
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

  // Campo de pontos atrás das áreas laranja: ondula com a rolagem e abre caminho para o cursor.
  var campo = document.getElementById('campo');
  if (campo && campo.getContext) {
    var cx = campo.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, gap = 30;
    var cursor = { x: -9999, y: -9999, k: 0 };
    var tinta = getComputedStyle(root).getPropertyValue('--ink').trim() || '#050f16';
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
      var R = 160, perto = [];
      cx.globalAlpha = 0.24;
      cx.beginPath();
      for (var y = -gap; y < H + gap; y += gap) {
        var py = y - desloc;
        var fase = (y + Math.floor(window.scrollY * 0.35 / gap) * gap) * 0.009;
        for (var x = gap / 2; x < W; x += gap) {
          var onda = t ? Math.sin(t * 0.0009 + x * 0.011 + fase) * amp : 0;
          var dx = x - cursor.x, dy = py - cursor.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < R) { perto.push([x, py + onda, dx, dy, d]); continue; }
          cx.moveTo(x + 1.7, py + onda);
          cx.arc(x, py + onda, 1.7, 0, 6.2832);
        }
      }
      cx.fill();
      // Pontos perto do cursor: são empurrados para fora e crescem.
      for (var i = 0; i < perto.length; i++) {
        var p = perto[i], k = (1 - p[4] / R) * cursor.k, empurra = k * k * 26;
        var nx = p[0] + (p[4] ? p[2] / p[4] * empurra : 0);
        var ny = p[1] + (p[4] ? p[3] / p[4] * empurra : 0);
        cx.globalAlpha = 0.24 + k * 0.5;
        cx.beginPath();
        cx.arc(nx, ny, 1.7 + k * 2.8, 0, 6.2832);
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
        pintar(t);
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
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        // Ctrl/Cmd/Shift-clique e botão do meio seguem o comportamento normal do navegador.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var id = a.getAttribute('href');
        var alvo = id.length > 1 && document.querySelector(id);
        if (!alvo) return;
        e.preventDefault();
        lenis.scrollTo(alvo, { offset: id === '#topo' ? 0 : -64 });
        history.replaceState(null, '', id);
        alvo.setAttribute('tabindex', '-1');
        alvo.focus({ preventScroll: true });
      });
    });
  }

  var mm = gsap.matchMedia();

  mm.add({ desktop: '(min-width: 900px)', phone: '(max-width: 899px)' }, function (ctx) {
    var desktop = ctx.conditions.desktop;

    // 1. Rasgar o cupom: o canhoto se solta pela linha picotada, o cupom sai e a sala acende.
    var rasgo = gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: desktop ? '+=120%' : '+=80%', scrub: 0.8, pin: true, anticipatePin: 1 }
    });
    rasgo
      .to('.ticket-stub', desktop
        ? { rotation: 16, xPercent: 45, yPercent: 120, transformOrigin: '0% 0%', ease: 'power2.in', duration: 1 }
        : { rotation: -9, yPercent: 160, transformOrigin: '0% 0%', ease: 'power2.in', duration: 1 }, 0)
      .to('.ticket-stub', { autoAlpha: 0, duration: 0.35 }, 0.65)
      .to('.ticket-main', { yPercent: -22, scale: 0.84, autoAlpha: 0, ease: 'power1.in', duration: 1 }, 0.35)
      .to('.hero-shade', { opacity: 0.12, ease: 'none', duration: 1.1 }, 0.2)
      .fromTo('.hero-bg', { scale: 1.16 }, { scale: 1, ease: 'none', duration: 1.4 }, 0);

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

    // 4. Pastas: cada projeto é arquivado por cima do anterior, que recua e escurece.
    var pastas = gsap.utils.toArray('.folder');
    pastas.forEach(function (f, i) {
      f.style.zIndex = i + 1;
      var prox = pastas[i + 1];
      if (!prox) return;
      var tampa = { trigger: prox, start: 'top bottom', end: 'top 116px', scrub: true };
      if (desktop) {
        ScrollTrigger.create({
          trigger: f,
          start: function () { return f.offsetHeight > window.innerHeight - 116 ? 'bottom bottom' : 'top 116px'; },
          endTrigger: prox, end: 'top 116px',
          pin: true, pinSpacing: false
        });
        gsap.timeline({ scrollTrigger: Object.assign({}, tampa) })
          .to(f.querySelector('.folder-in'), { scale: 0.92, y: -24, ease: 'none', duration: 1 }, 0)
          .to(f.querySelector('.folder-in'), { autoAlpha: 0, ease: 'none', duration: 0.25 }, 0.75);
      }
      gsap.to(f.querySelector('.folder-dim'), { opacity: desktop ? 0.55 : 0.25, ease: 'none', scrollTrigger: Object.assign({}, tampa) });
    });
    // As imagens dentro das pastas andam em ritmo próprio.
    gsap.utils.toArray('.pair img').forEach(function (img, i) {
      gsap.fromTo(img, { y: i ? 80 : 20 }, { y: i ? -40 : -20, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.slip', { rotation: -5, y: 40 }, { rotation: 1, y: -20, ease: 'none', scrollTrigger: { trigger: '.slip', start: 'top bottom', end: 'bottom top', scrub: true } });

    // 5. Canhotos da trajetória: saem de um maço e se espalham na fileira.
    var canhotos = gsap.utils.toArray('.stubs .stub');
    if (desktop) {
      gsap.fromTo(canhotos,
        { xPercent: function (i) { return -i * 104; }, rotation: function (i) { return -4 + i * 4; }, y: function (i) { return i * 10; } },
        { xPercent: 0, rotation: 0, y: 0, ease: 'power1.out', scrollTrigger: { trigger: '.stubs', start: 'top 85%', end: 'top 35%', scrub: 0.6 } });
    }

    // 6. Charqueadas: a foto aérea recua enquanto o cartão de contato chega.
    gsap.fromTo('.contact-bg', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: desktop ? 'bottom bottom' : 'center center', scrub: true } });

    // 7. Verso do cupom: o cartão vira de leve ao chegar.
    if (desktop) gsap.fromTo('.back-card', { rotateX: -24, y: 80, transformPerspective: 1200, transformOrigin: '50% 100%' },
      { rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.back', start: 'top bottom', end: 'top 40%', scrub: 0.6 } });

    return function () {
      etapas.forEach(function (li, j) { li.classList.toggle('is-at', j === 0); });
    };
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
  document.querySelectorAll('.h-head, .back-title').forEach(function (el) {
    var palavras = dividir(el);
    if (el.parentElement && el.parentElement.hasAttribute('data-rise')) {
      el.style.opacity = 1; el.style.transform = 'none'; el.style.transition = 'none';
    }
    gsap.from(palavras, {
      yPercent: 115, rotate: 6, duration: 1.1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true, refreshPriority: -1 }
    });
  });

  var refazer = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refazer);
  window.addEventListener('load', refazer);
})();

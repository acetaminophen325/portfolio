// Jovan Ng · portfolio
// Jobs: residue strips, hero decode, page-wide text decode on reveal,
// ambient letter flicker, scroll reveal, footer year.

document.documentElement.classList.add('js');

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Residue classes for strip coloring (simplified 3-class scheme):
// hydrophobic -> green, charged -> amber, polar/other -> neutral.
const HYDROPHOBIC = 'AVLIMFWPG';
const CHARGED = 'KRHDE';

function buildStrip(el) {
  const seq = el.dataset.seq || '';
  for (const aa of seq) {
    const cell = document.createElement('span');
    if (HYDROPHOBIC.includes(aa)) cell.className = 'r-hydro';
    else if (CHARGED.includes(aa)) cell.className = 'r-charged';
    else cell.className = 'r-polar';
    cell.title = aa;
    el.appendChild(cell);
  }
}

document.querySelectorAll('.residue-strip').forEach(buildStrip);

// Progress strip: the magainin sequence doubles as a scroll indicator.
// Cells light up in reading order; cells at section starts are marked.
const progress = document.getElementById('progress-strip');

if (progress) {
  buildStrip(progress);
  const cells = [...progress.children];
  let scrollTicking = false;

  function scrollMax() {
    return document.documentElement.scrollHeight - window.innerHeight;
  }

  function markSections() {
    cells.forEach((c) => {
      c.classList.remove('marker');
      c.removeAttribute('title');
    });
    const max = scrollMax();
    if (max <= 0) return;
    document.querySelectorAll('main section[id]').forEach((sec) => {
      const idx = Math.min(
        cells.length - 1,
        Math.round((sec.offsetTop / max) * (cells.length - 1))
      );
      cells[idx].classList.add('marker');
      cells[idx].title = sec.id;
    });
  }

  function updateProgress() {
    scrollTicking = false;
    const max = scrollMax();
    const frac = max > 0 ? Math.min(1, window.scrollY / max) : 1;
    const lit = Math.round(frac * cells.length);
    cells.forEach((c, i) => c.classList.toggle('lit', i < lit));
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    markSections();
    updateProgress();
  });

  window.addEventListener('load', () => {
    markSections();
    updateProgress();
  });

  markSections();
  updateProgress();
}

// Shared alphabet: everything flickers through amino acid letters.
const AA = 'ACDEFGHIKLMNPQRSTVWY';

function randAA(original) {
  const r = AA[Math.floor(Math.random() * AA.length)];
  return original === original.toLowerCase() ? r.toLowerCase() : r;
}

// Hero decode: span-based so cycling letters can be tinted green.
function decodeHero(el) {
  const target = el.dataset.text;
  if (!target || REDUCED) return;

  const chars = [...target];
  const settleAt = chars.map((_, i) => 260 + i * 34 + Math.random() * 120);
  const start = performance.now();
  el.setAttribute('aria-label', target);

  function frame(now) {
    const t = now - start;
    let html = '';
    let done = true;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (!/[a-zA-Z]/.test(c) || t >= settleAt[i]) {
        html += `<span class="settled">${c}</span>`;
      } else {
        done = false;
        html += `<span class="cycling">${randAA(c)}</span>`;
      }
    }
    el.innerHTML = html;
    if (!done) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = target;
      enableProximity(el, target);
    }
  }

  requestAnimationFrame(frame);
}

// Cursor-proximity flicker: after the hero settles, letters near a fine
// pointer resample briefly, like the model re-rolling where you point.
function enableProximity(el, target) {
  if (REDUCED || !window.matchMedia('(pointer: fine)').matches) return;

  const wrap = document.createElement('span');
  wrap.setAttribute('aria-hidden', 'true');
  for (const c of target) {
    const s = document.createElement('span');
    s.textContent = c;
    wrap.appendChild(s);
  }
  el.textContent = '';
  el.setAttribute('aria-label', target);
  el.appendChild(wrap);

  const spans = [...wrap.children];
  spans.forEach((s) => { s.dataset.orig = s.textContent; });
  const hero = el.closest('.hero') || el;
  const RADIUS_SQ = 55 * 55;
  let mx = -1e4;
  let my = -1e4;
  let raf = null;

  function tick() {
    raf = null;
    let anyNear = false;
    const now = performance.now();
    for (const s of spans) {
      const orig = s.dataset.orig;
      if (!/[a-zA-Z]/.test(orig)) continue;
      const r = s.getBoundingClientRect();
      const dx = r.left + r.width / 2 - mx;
      const dy = r.top + r.height / 2 - my;
      if (dx * dx + dy * dy < RADIUS_SQ) {
        anyNear = true;
        if (!s.dataset.until || +s.dataset.until < now) {
          s.textContent = randAA(orig);
          s.classList.add('cycling');
          s.dataset.until = now + 90;
        }
      } else if (s.classList.contains('cycling')) {
        s.textContent = orig;
        s.classList.remove('cycling');
        delete s.dataset.until;
      }
    }
    if (anyNear) raf = requestAnimationFrame(tick);
  }

  function queueTick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  hero.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    queueTick();
  });

  hero.addEventListener('mouseleave', () => {
    mx = -1e4;
    my = -1e4;
    queueTick();
  });
}

const heroTitle = document.querySelector('.decode');
if (heroTitle) decodeHero(heroTitle);

// Page-wide decode: walks text nodes so links, spans, and markup survive.
// Only letters cycle; digits, punctuation, and spacing hold still.
function textNodesIn(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  }
  return nodes;
}

function scramble(el, duration) {
  if (REDUCED || el.dataset.scrambling === '1') return;
  const nodes = textNodesIn(el);
  const total = nodes.reduce((sum, n) => sum + n.nodeValue.length, 0);
  if (!total) return;

  el.dataset.scrambling = '1';
  let globalIndex = 0;
  const items = nodes.map((n) => {
    const orig = n.nodeValue;
    const settle = [...orig].map(() => {
      globalIndex++;
      return ((globalIndex / total) * 0.55 + Math.random() * 0.45) * duration;
    });
    return { n, orig, settle };
  });

  const start = performance.now();

  function frame(now) {
    const t = now - start;
    let done = true;
    for (const item of items) {
      let out = '';
      for (let i = 0; i < item.orig.length; i++) {
        const c = item.orig[i];
        if (!/[a-zA-Z]/.test(c) || t >= item.settle[i]) {
          out += c;
        } else {
          done = false;
          out += randAA(c);
        }
      }
      if (item.n.nodeValue !== out) item.n.nodeValue = out;
    }
    if (!done) {
      requestAnimationFrame(frame);
    } else {
      items.forEach((item) => { item.n.nodeValue = item.orig; });
      delete el.dataset.scrambling;
    }
  }

  requestAnimationFrame(frame);
}

const DISPLAY_SELECTOR = 'h2, .entry-body h3, .fasta, .kicker';
const META_SELECTOR = '.status, .tag, .meta-line, .skill-group h3, .skills-langs, .residue-caption, .section-note, .media-slot-label, .wordmark, .site-nav a';

function durationFor(el) {
  if (el.matches(META_SELECTOR)) return 550;
  if (el.matches(DISPLAY_SELECTOR)) return 800;
  return 320; // body text settles fast
}

const scrambleTargets = document.querySelectorAll(
  [
    DISPLAY_SELECTOR,
    META_SELECTOR,
    'main p:not(.fasta):not(.kicker):not(.status):not(.meta-line):not(.section-note):not(.skills-langs):not(.residue-caption):not(.media-slot-label)',
    'main li:not(.tag)',
    '.btn',
    '.site-footer > p'
  ].join(', ')
);

if (!REDUCED && 'IntersectionObserver' in window) {
  const decodeIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          scramble(e.target, durationFor(e.target));
          decodeIO.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -4% 0px' }
  );
  scrambleTargets.forEach((el) => decodeIO.observe(el));
}

// Ambient flicker: every few seconds one letter somewhere on screen
// briefly cycles, so the page keeps breathing after everything settles.
// Pool is limited to elements with no child elements so innerHTML is safe.
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ambientPool = [...document.querySelectorAll(META_SELECTOR + ', .fasta, .kicker, h2, .entry-body h3, .filter-btn')]
  .filter((el) => el.children.length === 0);

function ambientFlick() {
  if (REDUCED || document.hidden || Math.random() < 0.25) return;

  const visible = ambientPool.filter((el) => {
    if (el.dataset.scrambling === '1') return false;
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  if (!visible.length) return;

  const el = visible[Math.floor(Math.random() * visible.length)];
  const text = el.textContent;
  const letterIndices = [...text]
    .map((c, i) => (/[a-zA-Z]/.test(c) ? i : -1))
    .filter((i) => i >= 0);
  if (!letterIndices.length) return;

  const pos = letterIndices[Math.floor(Math.random() * letterIndices.length)];
  el.dataset.scrambling = '1';
  let ticks = 0;

  const iv = setInterval(() => {
    ticks++;
    if (ticks > 4) {
      clearInterval(iv);
      el.textContent = text;
      delete el.dataset.scrambling;
      return;
    }
    el.innerHTML =
      escapeHtml(text.slice(0, pos)) +
      '<span class="flick">' + randAA(text[pos]) + '</span>' +
      escapeHtml(text.slice(pos + 1));
  }, 70);
}

if (!REDUCED) setInterval(ambientFlick, 1100);

// Project filter: channel chips highlight matching entries, dim the rest.
const filterButtons = document.querySelectorAll('.filter-btn');
const entries = document.querySelectorAll('.entry');

function domainsOf(entry) {
  const found = [];
  if (entry.querySelector('.tag-ml')) found.push('ml');
  if (entry.querySelector('.tag-bio')) found.push('bio');
  if (entry.querySelector('.tag-sys')) found.push('sys');
  if (entry.querySelector('.tag-web')) found.push('web');
  return found;
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    filterButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    entries.forEach((entry) => {
      const dim = filter !== 'all' && !domainsOf(entry).includes(filter);
      entry.classList.toggle('dimmed', dim);
    });
  });
});

// Scroll reveal for sections and entries.
const revealables = document.querySelectorAll('.section-head, .entry, .also, .about-grid, .skills-grid, .contact-links');
revealables.forEach((el) => el.classList.add('reveal'));

if ('IntersectionObserver' in window && !REDUCED) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('in'));
}

// Footer year.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

// Jovan Ng · portfolio
// Three jobs: build the residue strips, run the hero decode, reveal sections.

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

// Hero decode: letters cycle through the amino acid alphabet, then settle
// left to right, like a model sampling residues.
const AA = 'ACDEFGHIKLMNPQRSTVWY';

function decode(el) {
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
        const r = AA[Math.floor(Math.random() * AA.length)];
        html += `<span class="cycling">${i % 2 ? r.toLowerCase() : r}</span>`;
      }
    }
    el.innerHTML = html;
    if (!done) requestAnimationFrame(frame);
    else el.textContent = target;
  }

  requestAnimationFrame(frame);
}

const heroTitle = document.querySelector('.decode');
if (heroTitle) decode(heroTitle);

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

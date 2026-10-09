/* ═══ DORUTOCHAN APP ═══ */

const FORMSPREE_ID = "YOUR_FORMSPREE_ID";
const TELEGRAM = "https://t.me/Dorutochan";
let allPosts = [];

// ─── Load JSON ───
async function loadJSON(path) {
  try {
    const r = await fetch(path + '?v=' + Date.now());
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

// ─── Render Poster ───
function posterHTML(p) {
  return `
    <a href="${p.link || '#'}" target="${p.link ? '_blank' : '_self'}" class="poster">
      <img src="${p.image || 'https://via.placeholder.com/300x450/16161f/7c5cff?text=D'}"
           alt="${esc(p.title)}" loading="lazy">
      <div class="poster-info">
        <div class="poster-title">${esc(p.title)}</div>
        <div class="poster-meta">${p.type || ''} ${p.tags?.length ? '· ' + p.tags[0] : ''}</div>
      </div>
    </a>`;
}

function fillRow(id, posts) {
  const box = document.getElementById(id);
  if (!box) return;
  if (!posts.length) { box.innerHTML = '<p style="color:#888;padding:1rem 0">Koi content nahi.</p>'; return; }
  box.innerHTML = posts.map(posterHTML).join('');
}

function fillGrid(id, posts) {
  const box = document.getElementById(id);
  if (!box) return;
  if (!posts.length) { box.innerHTML = '<p style="color:#888;padding:2rem;text-align:center;grid-column:1/-1">Koi content nahi mila.</p>'; return; }
  box.innerHTML = posts.map(posterHTML).join('');
}

function scrollRow(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
}

// ─── News ───
function renderNews(news, boxId = 'newsList', limit = 0) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const items = limit ? news.slice(0, limit) : news;
  if (!items.length) { box.innerHTML = '<p style="color:#888">Abhi koi news nahi.</p>'; return; }
  box.innerHTML = items.map(n => `
    <div class="news-item">
      <h4>${esc(n.title)}</h4>
      <div class="date">${n.date || ''}</div>
      <p>${esc(n.body || '')}</p>
    </div>`).join('');
}

// ─── Requests ───
function renderRequests(reqs, boxId = 'recentRequests') {
  const box = document.getElementById(boxId);
  if (!box) return;
  if (!reqs.length) { box.innerHTML = '<p style="color:#888;font-size:.9rem">Abhi koi request nahi.</p>'; return; }
  box.innerHTML = reqs.slice(0, 10).map(r => `
    <div class="req-item">
      <span class="req-type">${esc(r.type || 'Other')}</span>
      <span class="req-title">${esc(r.title)}</span>
      <span class="req-date">${r.date || ''}</span>
    </div>`).join('');
}

// ─── Request Form ───
function initRequestForm() {
  const form = document.getElementById('requestForm');
  if (!form) return;
  const msg = document.getElementById('reqMsg');
  const btn = document.getElementById('reqSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = ''; msg.className = 'form-msg';
    const btnText = btn.querySelector('.btn-text');
    const btnLoad = btn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoad) btnLoad.style.display = 'inline';
    btn.disabled = true;

    const fd = new FormData(form);
    const payload = {
      name: fd.get('name') || 'Anonymous',
      email: fd.get('email') || '',
      type: fd.get('type'),
      title: fd.get('title'),
      description: fd.get('description') || '',
      _subject: `🎬 Dorutochan Request: ${fd.get('title')}`
    };

    try {
      if (!FORMSPREE_ID || FORMSPREE_ID === 'YOUR_FORMSPREE_ID') {
        await new Promise(r => setTimeout(r, 700));
        msg.textContent = '✅ Demo mode — Formspree ID set karo asli ke liye';
        msg.classList.add('ok');
      } else {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        msg.textContent = '🎉 Request mil gayi! Hum jald hi laayenge.';
        msg.classList.add('ok');
      }
      form.reset();
    } catch {
      msg.textContent = '❌ Problem hui. Telegram pe message karo.';
      msg.classList.add('err');
    } finally {
      if (btnText) btnText.style.display = 'inline';
      if (btnLoad) btnLoad.style.display = 'none';
      btn.disabled = false;
    }
  });
}

// ─── Search ───
function initSearch() {
  const input = document.getElementById('search');
  if (!input) return;
  input.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = !q ? allPosts : allPosts.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.type || '').toLowerCase().includes(q)
    );
    if (document.getElementById('trendingRow')) {
      fillRow('trendingRow', filtered.filter(p => p.trending).slice(0, 20));
    }
    if (document.getElementById('animeGrid')) fillGrid('animeGrid', filtered.filter(p => p.type === 'anime'));
    if (document.getElementById('cartoonGrid')) fillGrid('cartoonGrid', filtered.filter(p => p.type === 'cartoon'));
  });
}

// ─── Mobile Menu ───
function initMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('navMenu');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.style.display === 'flex';
    nav.style.cssText = open ? '' :
      'display:flex;position:fixed;flex-direction:column;background:rgba(10,10,15,.98);padding:5rem 2rem 2rem;top:0;left:0;right:0;z-index:99;border-bottom:1px solid #22222e;gap:1.2rem;';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.style.cssText = ''));
}

// ─── Popup ───
function initPopup() {
  const popup = document.getElementById('popup');
  if (!popup) return;
  const KEY = 'doruto_popup_seen_v3';
  if (localStorage.getItem(KEY)) return;
  setTimeout(() => popup.classList.add('show'), 8000);
  const hide = () => { popup.classList.remove('show'); localStorage.setItem(KEY, Date.now()); };
  document.getElementById('popupClose')?.addEventListener('click', hide);
  document.getElementById('popupSkip')?.addEventListener('click', hide);
  popup.addEventListener('click', e => { if (e.target === popup) hide(); });
}

// ─── To Top ───
function initToTop() {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── Utility ───
function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();
  initMenu();
  initPopup();
  initToTop();
  initRequestForm();
  initSearch();

  const page = location.pathname.split('/').pop() || 'index.html';

  // HOME
  if (page === 'index.html' || page === '') {
    const data = await loadJSON('data/posts.json');
    allPosts = data?.posts || [];
    fillRow('trendingRow', allPosts.filter(p => p.trending).slice(0, 20));
    const news = await loadJSON('data/news.json');
    renderNews(news?.news || [], 'newsList', 3);
  }

  // ANIME
  if (page === 'anime.html') {
    const data = await loadJSON('data/posts.json');
    allPosts = data?.posts || [];
    fillGrid('animeGrid', allPosts.filter(p => p.type === 'anime'));
  }

  // CARTOON
  if (page === 'cartoon.html') {
    const data = await loadJSON('data/posts.json');
    allPosts = data?.posts || [];
    fillGrid('cartoonGrid', allPosts.filter(p => p.type === 'cartoon'));
  }

  // NEWS
  if (page === 'news.html') {
    const data = await loadJSON('data/news.json');
    renderNews(data?.news || [], 'newsList');
  }

  // REQUEST
  if (page === 'request.html') {
    const data = await loadJSON('data/requests.json');
    renderRequests(data?.requests || [], 'recentRequests');
  }
});
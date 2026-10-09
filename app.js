/* ═══════════════════════════════════════════════
   DORUTOCHAN — App Logic
   ═══════════════════════════════════════════════ */

// 🔴 APNA FORMSPREE ID YAHAN DAALO
const FORMSPREE_ID = "YOUR_FORMSPREE_ID";  // e.g. "xpzgkqwe"

let allPosts = [];

// ───────── LOAD DATA ─────────
async function loadJSON(path) {
  try {
    const r = await fetch(path + '?v=' + Date.now());
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { console.warn(e); return null; }
}

// ───────── INIT ─────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const [postsData, newsData, reqData] = await Promise.all([
    loadJSON('data/posts.json'),
    loadJSON('data/news.json'),
    loadJSON('data/requests.json')
  ]);

  allPosts = postsData?.posts || [];
  renderAllRows(allPosts);
  renderNews(newsData?.news || []);
  renderRecentRequests(reqData?.requests || []);

  initHeader();
  initSearch();
  initPopup();
  initToTop();
  initRequestForm();
  initMenu();
});

// ───────── ROWS ─────────
function renderAllRows(posts) {
  const trending = posts.filter(p => p.trending).slice(0, 20);
  const anime    = posts.filter(p => p.type === 'anime').slice(0, 20);
  const cartoon  = posts.filter(p => p.type === 'cartoon').slice(0, 20);
  const newReleases = [...posts].sort((a,b) =>
    new Date(b.date||0) - new Date(a.date||0)
  ).slice(0, 20);

  fillRow('trendingRow', trending.length ? trending : posts.slice(0, 12));
  fillRow('animeRow', anime);
  fillRow('cartoonRow', cartoon);
  fillRow('newRow', newReleases);
}

function fillRow(id, posts) {
  const box = document.getElementById(id);
  if (!box) return;
  if (!posts.length) {
    box.innerHTML = `<p style="color:#888;padding:1rem 0">Abhi koi content nahi. Admin panel se add karo.</p>`;
    return;
  }
  box.innerHTML = posts.map(p => `
    <a href="${p.link || '#'}" target="${p.link ? '_blank' : '_self'}" class="poster">
      <img src="${p.image || 'https://via.placeholder.com/300x450/16161f/7c5cff?text=Dorutochan'}"
           alt="${escapeHtml(p.title)}" loading="lazy">
      <div class="poster-info">
        <div class="poster-title">${escapeHtml(p.title)}</div>
        <div class="poster-meta">${p.type || ''} ${p.tags?.length ? '· ' + p.tags[0] : ''}</div>
      </div>
    </a>
  `).join('');
}

function scrollRow(id, dir) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: 'smooth' });
}

// ───────── SEARCH ─────────
function initSearch() {
  const input = document.getElementById('search');
  input?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) { renderAllRows(allPosts); return; }
    const filtered = allPosts.filter(p =>
      (p.title||'').toLowerCase().includes(q) ||
      (p.tags||[]).some(t => t.toLowerCase().includes(q)) ||
      (p.type||'').toLowerCase().includes(q)
    );
    fillRow('trendingRow', filtered);
    fillRow('animeRow', filtered.filter(p => p.type === 'anime'));
    fillRow('cartoonRow', filtered.filter(p => p.type === 'cartoon'));
    fillRow('newRow', filtered);
  });
}

// ───────── NEWS ─────────
function renderNews(news) {
  const box = document.getElementById('newsList');
  if (!news.length) { box.innerHTML = '<p style="color:#888">Abhi koi news nahi.</p>'; return; }
  box.innerHTML = news.map(n => `
    <div class="news-item">
      <h4>${escapeHtml(n.title)}</h4>
      <div class="date">${n.date || ''}</div>
      <p>${escapeHtml(n.body || '')}</p>
    </div>
  `).join('');
}

// ───────── RECENT REQUESTS ─────────
function renderRecentRequests(reqs) {
  const box = document.getElementById('recentRequests');
  if (!reqs.length) {
    box.innerHTML = '<p style="color:#888;font-size:.9rem">Abhi koi request nahi. Pehle banne wale aap ho!</p>';
    return;
  }
  box.innerHTML = reqs.slice(0, 8).map(r => `
    <div class="req-item">
      <span class="req-type">${escapeHtml(r.type || 'Other')}</span>
      <span class="req-title">${escapeHtml(r.title)}</span>
      <span class="req-date">${r.date || ''}</span>
    </div>
  `).join('');
}

// ───────── REQUEST FORM ─────────
function initRequestForm() {
  const form = document.getElementById('requestForm');
  const msg = document.getElementById('reqMsg');
  const btn = document.getElementById('reqSubmit');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = ''; msg.className = 'form-msg';

    const btnText = btn.querySelector('.btn-text');
    const btnLoad = btn.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoad.style.display = 'inline';
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
        // Demo mode (Formspree ID set nahi ki)
        await new Promise(r => setTimeout(r, 800));
        console.log('Demo mode — request:', payload);
        msg.textContent = '✅ Demo mode: Request mil gayi (Formspree ID set karo asli ke liye)';
        msg.classList.add('ok');
      } else {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Formspree error');
        msg.textContent = '🎉 Request mil gayi! Hum jald hi laayenge.';
        msg.classList.add('ok');
      }
      form.reset();
      saveMyRequest(payload);
    } catch (err) {
      console.error(err);
      msg.textContent = '❌ Kuch problem hui. Telegram pe message kar do.';
      msg.classList.add('err');
    } finally {
      btnText.style.display = 'inline';
      btnLoad.style.display = 'none';
      btn.disabled = false;
    }
  });
}

function saveMyRequest(payload) {
  try {
    const key = 'doruto_my_requests';
    const cur = JSON.parse(localStorage.getItem(key) || '[]');
    cur.unshift({ ...payload, date: new Date().toISOString().slice(0,10) });
    localStorage.setItem(key, JSON.stringify(cur.slice(0, 20)));
  } catch (e) {}
}

// ───────── HEADER SCROLL ─────────
function initHeader() {
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ───────── MOBILE MENU ─────────
function initMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.querySelector('.nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.style.display === 'flex';
    if (open) {
      nav.style.cssText = '';
    } else {
      nav.style.cssText = 'display:flex;position:fixed;flex-direction:column;background:rgba(10,10,15,.98);padding:5rem 2rem 2rem;top:0;left:0;right:0;z-index:99;border-bottom:1px solid #22222e;gap:1.2rem;';
    }
  });
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => { btn.click(); });
  });
}

// ───────── POPUP ─────────
function initPopup() {
  const popup = document.getElementById('popup');
  const close = document.getElementById('popupClose');
  const skip = document.getElementById('popupSkip');
  const KEY = 'doruto_popup_seen_v2';

  if (!localStorage.getItem(KEY)) {
    setTimeout(() => popup.classList.add('show'), 8000);
  }
  const hide = () => {
    popup.classList.remove('show');
    localStorage.setItem(KEY, Date.now());
  };
  close?.addEventListener('click', hide);
  skip?.addEventListener('click', hide);
  popup?.addEventListener('click', e => { if (e.target === popup) hide(); });
}

// ───────── TO TOP ─────────
function initToTop() {
  const btn = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('show');
    else btn.classList.remove('show');
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ───────── UTIL ─────────
function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]
  ));
}
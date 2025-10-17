
const API = 'https://api.coingecko.com/api/v3';
const FAVS_KEY = 'apicoin:favs';

let _coinsCache = null;
let _abort = null;

export const route = {
  path: /^\/coins$/,
  view: CoinsView
};

export async function CoinsView() {
  const $app = document.getElementById('app');
  if (!$app) return;

  $app.innerHTML = `<h1>Coins</h1><p class="muted">Cargando…</p>`;

  try {
    if (_abort) _abort.abort();
    _abort = new AbortController();

    if (!_coinsCache) {
      const res = await fetch(`${API}/coins/list`, { signal: _abort.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _coinsCache = await res.json(); // [{id, symbol, name}]
    }

    // ---- Estado local ----
    let q = '';
    let letter = '';
    let page = 1;
    const pageSize = 50;

    // ---- Helpers ----
    const fmt = { num: n => (typeof n === 'number' ? n.toLocaleString() : '—') };
    const debounce = (fn, ms=200) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

    const getFavs = () => new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'));
    const setFavs = (s) => localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
    const isFav = (id) => getFavs().has(id);
    const toggleFav = (id) => { const s = getFavs(); s.has(id) ? s.delete(id) : s.add(id); setFavs(s); };

    // ---- Render / mount ----
    const mount = () => {
      const filtered = _coinsCache
        .filter(c => !letter || (c.name?.[0]?.toUpperCase() === letter))
        .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));

      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, totalPages);
      const start = (page - 1) * pageSize;
      const slice = filtered.slice(start, start + pageSize);

      $app.innerHTML = `
        <h1>Coins</h1>
        <div class="controls">
          <input id="q" type="text" placeholder="Buscar por nombre, símbolo o id..." value="${q}" />
          <select id="letter">
            <option value="">Filtrar por inicial</option>
            ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch => `<option value="${ch}" ${letter===ch?'selected':''}>${ch}</option>`).join('')}
          </select>
          <span class="badge">Total: ${fmt.num(filtered.length)}</span>
          <button id="prev" ${page<=1?'disabled':''}>◀ Prev</button>
          <span class="badge">Página ${page}/${totalPages}</span>
          <button id="next" ${page>=totalPages?'disabled':''}>Next ▶</button>
          <a class="badge" href="#/watchlist">Ver Watchlist ⭐</a>
        </div>

        <table class="table" role="table" aria-label="Listado de monedas">
          <thead>
            <tr><th>#</th><th>Nombre</th><th>Símbolo</th><th>ID</th><th>Fav</th></tr>
          </thead>
          <tbody>
            ${slice.map((c, i) => `
              <tr>
                <td>${fmt.num(start + i + 1)}</td>
                <td><a href="#/coins/${c.id}" aria-label="Ver detalle de ${c.name}">${c.name}</a></td>
                <td class="mono">${c.symbol?.toUpperCase() ?? ''}</td>
                <td class="mono">${c.id}</td>
                <td>
                  <button class="fav-btn" data-id="${c.id}" aria-label="Marcar favorito">
                    ${isFav(c.id) ? '⭐' : '☆'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Handlers
      const onSearch = debounce((e) => { q = e.target.value.trim().toLowerCase(); page = 1; mount(); }, 250);
      document.getElementById('q').addEventListener('input', onSearch);
      document.getElementById('letter').addEventListener('change', (e) => { letter = e.target.value; page = 1; mount(); });
      document.getElementById('prev').addEventListener('click', () => { if (page>1) { page--; mount(); }});
      document.getElementById('next').addEventListener('click', () => { page++; mount(); });

      // Delegación de eventos para la estrella
      $app.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault(); // evita navegar si está dentro de <a>
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          toggleFav(id);
          // re-render solo la estrella
          e.currentTarget.textContent = isFav(id) ? '⭐' : '☆';
        });
      });
    };

    mount();
  } catch (err) {
    if (err.name === 'AbortError') return;
    $app.innerHTML = `
      <h1>Coins</h1>
      <p class="alert">No se pudo cargar el listado. Reintenta más tarde.</p>
      <div class="controls">
        <button id="retry">Reintentar</button>
      </div>
    `;
    document.getElementById('retry')?.addEventListener('click', CoinsView);
    console.error(err);
  }
}
// watchlist.js — Favoritos con precios en vivo
const API = 'https://api.coingecko.com/api/v3';
const FAVS_KEY = 'apicoin:favs';
let _abortWL = null;

export const route = { path: /^\/watchlist$/, view: WatchlistView };

export async function WatchlistView() {
  const $app = document.getElementById('app'); if (!$app) return;

  const getFavs = () => new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'));
  const setFavs = (s) => localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
  const vsDefault = (sessionStorage.getItem('apicoin:vs') || 'usd');

  const fmt = {
    num: n => (typeof n==='number'? n.toLocaleString():'—'),
    money: (n,c=vsDefault)=> typeof n==='number'? `${c.toUpperCase()} ${n.toLocaleString(undefined,{maximumFractionDigits:2})}`:'—',
    pct: n => (typeof n==='number'? `${n.toFixed(2)}%`:'—')
  };

  const renderEmpty = () => {
    $app.innerHTML = `<h1>Watchlist</h1><p class="muted">Sin favoritos. Abre una moneda y marca “☆ Favorito”.</p><a class="badge" href="#/coins">← Ir a Coins</a>`;
  };

  const renderTable = (rows, vs) => {
    $app.innerHTML = `
      <h1>Watchlist</h1>
      <div class="controls">
        <select id="vs">${['usd','eur','cop','mxn','ars','brl'].map(opt=>`<option value="${opt}" ${opt===vs?'selected':''}>${opt.toUpperCase()}</option>`).join('')}</select>
        <button id="refresh">Actualizar</button>
        <span class="badge">Total: ${fmt.num(rows.length)}</span>
        <button id="clear">Limpiar favoritos</button>
      </div>
      <table class="table">
        <thead><tr><th>#</th><th>Moneda</th><th>Precio</th><th>% 24h</th><th>Cap</th><th></th></tr></thead>
        <tbody>
          ${rows.map((r,i)=>`
            <tr data-id="${r.id}">
              <td>${fmt.num(i+1)}</td>
              <td><a href="#/coins/${r.id}">${r.name}</a> <span class="mono muted">${r.symbol?.toUpperCase()||''}</span></td>
              <td>${fmt.money(r.current_price, vs)}</td>
              <td>${fmt.pct(r.price_change_percentage_24h)}</td>
              <td>${fmt.money(r.market_cap, vs)}</td>
              <td><button class="unfav">Quitar ⭐</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('refresh').addEventListener('click', WatchlistView);
    document.getElementById('clear').addEventListener('click', ()=>{ if(confirm('¿Eliminar todos?')) { setFavs(new Set()); WatchlistView(); }});
    document.getElementById('vs').addEventListener('change', (e)=>{ sessionStorage.setItem('apicoin:vs', e.target.value); WatchlistView(); });
    $app.querySelectorAll('.unfav').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = e.target.closest('tr')?.dataset?.id; if(!id) return;
        const s = getFavs(); s.delete(id); setFavs(s); WatchlistView();
      });
    });
  };

  const favs = getFavs(); if (!favs.size) return renderEmpty();
  const vs = (sessionStorage.getItem('apicoin:vs') || 'usd');
  $app.innerHTML = `<h1>Watchlist</h1><p class="muted">Sincronizando precios…</p>`;

  const ids = [...favs];
  const chunks = []; for (let i=0;i<ids.length;i+=50) chunks.push(ids.slice(i,i+50));

  try {
    if (_abortWL) _abortWL.abort(); _abortWL = new AbortController();
    const fetchChunk = async (chunk) => {
      const url = new URL(`${API}/coins/markets`);
      url.searchParams.set('vs_currency', vs);
      url.searchParams.set('ids', chunk.join(','));
      url.searchParams.set('price_change_percentage','24h');
      const res = await fetch(url.toString(), { signal: _abortWL.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };
    const results = await Promise.all(chunks.map(fetchChunk));
    const rows = results.flat().sort((a,b)=>(b.market_cap??0)-(a.market_cap??0));
    renderTable(rows, vs);
  } catch (err) {
    if (err.name === 'AbortError') return;
    $app.innerHTML = `<h1>Watchlist</h1><p class="alert">No se pudo cargar la watchlist.</p><div class="controls"><button id="retry">Reintentar</button><button id="clear">Limpiar</button></div>`;
    document.getElementById('retry')?.addEventListener('click', WatchlistView);
    document.getElementById('clear')?.addEventListener('click', ()=>{ setFavs(new Set()); WatchlistView(); });
    console.error(err);
  }
}
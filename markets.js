// markets.js
const API = 'https://api.coingecko.com/api/v3';
let _abortMarkets = null, _page = 1;

export const route = { path: /^\/markets$/, view: MarketsView };

export async function MarketsView() {
  const $app = document.getElementById('app'); if (!$app) return;
  const perPage = 50;
  const vsOpts = ['usd','eur','cop','mxn','ars','brl'];
  let vs = (sessionStorage.getItem('apicoin:vs') || 'usd');

  const fmt = {
    num: n => (typeof n==='number'? n.toLocaleString(): '—'),
    money: (n,c=vs)=> typeof n==='number'? `${c.toUpperCase()} ${n.toLocaleString(undefined,{maximumFractionDigits:2})}`:'—',
    pct: n => (typeof n==='number'? `${n.toFixed(2)}%`:'—')
  };

  const renderTable = (rows) => {
    $app.innerHTML = `
      <h1>Markets</h1>
      <div class="controls">
        <button id="prev" ${_page<=1?'disabled':''}>◀ Prev</button>
        <span class="badge">Página ${_page}</span>
        <button id="next" ${rows.length<perPage?'disabled':''}>Next ▶</button>
        <select id="vs">${vsOpts.map(opt=>`<option value="${opt}" ${opt===vs?'selected':''}>${opt.toUpperCase()}</option>`).join('')}</select>
        <button id="refresh">Actualizar</button>
      </div>
      <table class="table"><thead><tr><th>#</th><th>Nombre</th><th>Precio</th><th>Cap</th><th>Vol 24h</th><th>% 24h</th></tr></thead>
        <tbody>
          ${rows.map((r,i)=>`
            <tr>
              <td>${fmt.num((_page-1)*perPage+i+1)}</td>
              <td><a href="#/coins/${r.id}">${r.name}</a> <span class="mono muted">${r.symbol?.toUpperCase()||''}</span></td>
              <td>${fmt.money(r.current_price)}</td>
              <td>${fmt.money(r.market_cap)}</td>
              <td>${fmt.money(r.total_volume)}</td>
              <td>${fmt.pct(r.price_change_percentage_24h)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    document.getElementById('prev').addEventListener('click', ()=>{ if(_page>1){ _page--; MarketsView(); }});
    document.getElementById('next').addEventListener('click', ()=>{ _page++; MarketsView(); });
    document.getElementById('refresh').addEventListener('click', MarketsView);
    document.getElementById('vs').addEventListener('change', (e)=>{ vs=e.target.value; sessionStorage.setItem('apicoin:vs', vs); _page=1; MarketsView(); });
  };

  try {
    if (_abortMarkets) _abortMarkets.abort(); _abortMarkets = new AbortController();
    $app.innerHTML = `<h1>Markets</h1><p class="muted">Cargando página ${_page}…</p>`;
    const url = new URL(`${API}/coins/markets`);
    url.searchParams.set('vs_currency', vs);
    url.searchParams.set('order','market_cap_desc');
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(_page));
    url.searchParams.set('price_change_percentage','24h');
    const res = await fetch(url.toString(), { signal: _abortMarkets.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    renderTable(rows);
  } catch (err) {
    if (err.name === 'AbortError') return;
    $app.innerHTML = `<h1>Markets</h1><p class="alert">No se pudo cargar Markets.</p><div class="controls"><button id="retry">Reintentar</button></div>`;
    document.getElementById('retry')?.addEventListener('click', MarketsView);
    console.error(err);
  }
}
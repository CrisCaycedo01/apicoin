const API = 'https://api.coingecko.com/api/v3';

let _abortTrending = null;

export const route = {
  path: /^\/trending$/,   // coincide con "#/trending"
  view: TrendingView
};

export async function TrendingView() {
  const $app = document.getElementById('app');
  if (!$app) return;

  $app.innerHTML = `
    <h1>Trending</h1>
    <p class="muted">Cargando tendencias…</p>
  `;

  try {
    if (_abortTrending) _abortTrending.abort();
    _abortTrending = new AbortController();

    const res = await fetch(`${API}/search/trending`, { signal: _abortTrending.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();

    const items = (payload.coins || []).map(x => x.item); // item: { id, name, symbol, score, market_cap_rank, data?.price }

    const fmt = {
      num: (n) => (typeof n === 'number' ? n.toLocaleString() : '—'),
      usd: (n) => (typeof n === 'number'
        ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
        : '—')
    };

    $app.innerHTML = `
      <h1>Trending</h1>
      <div class="controls">
        <button id="refresh">Actualizar</button>
        <span class="badge">Total: ${fmt.num(items.length)}</span>
      </div>

      <table class="table" role="table" aria-label="Monedas en tendencia">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Símbolo</th>
            <th>Score</th>
            <th>Precio (USD)</th>
            <th>Market Cap Rank</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((t, i) => `
            <tr>
              <td>${fmt.num(i + 1)}</td>
              <td><a href="#/coins/${t.id}" aria-label="Ver detalle de ${t.name}">${t.name}</a></td>
              <td class="mono">${(t.symbol || '').toUpperCase()}</td>
              <td>${fmt.num(t.score)}</td>
              <td>${fmt.usd(t.data?.price)}</td>
              <td>${fmt.num(t.market_cap_rank)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('refresh')?.addEventListener('click', TrendingView);

  } catch (err) {
    if (err.name === 'AbortError') return;
    $app.innerHTML = `
      <h1>Trending</h1>
      <p class="alert">No se pudo cargar Trending.</p>
      <div class="controls">
        <button id="retry">Reintentar</button>
      </div>
    `;
    document.getElementById('retry')?.addEventListener('click', TrendingView);
    console.error(err);
  }
}
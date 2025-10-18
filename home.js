// home.js — Home
export const route = { path: /^\/$/, view: HomeView };

export async function HomeView() {
  const $app = document.getElementById('app');
  if (!$app) return;

  $app.innerHTML = `
    <h1>Crypto Dashboard</h1>
    <p class="muted">Explora: Coins, Trending, Markets y tu Watchlist.</p>

    <div class="grid">
      <div>
        <h3>Coins</h3>
        <p>Catálogo completo con buscador y filtro.</p>
        <a class="badge" href="#/coins">Ir →</a>
      </div>
      <div>
        <h3>Trending</h3>
        <p>Lo que más se mueve ahora.</p>
        <a class="badge" href="#/trending">Ver →</a>
      </div>
      <div>
        <h3>Markets</h3>
        <p>Top por capitalización, precio y variación 24h.</p>
        <a class="badge" href="#/markets">Abrir →</a>
      </div>
      <div>
        <h3>Watchlist</h3>
        <p>Tus favoritos con precio en vivo.</p>
        <a class="badge" href="#/watchlist">Abrir →</a>
      </div>
    </div>
  `;
}
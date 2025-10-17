export const route = {
  path: /^\/$/,
  view: HomeView
};

export async function HomeView() {
  const $app = document.getElementById('app');
  if (!$app) return;

  $app.innerHTML = `
    <h1>Crypto Dashboard</h1>
    <p class="muted">
      Explora el ecosistema: listado completo de monedas, tendencias y mercados en vivo con CoinGecko.
    </p>

    <div class="grid">
      <div>
        <h3>Coins</h3>
        <p>Catálogo completo de monedas. Búscalas por nombre o símbolo y entra al detalle.</p>
        <a class="badge" href="#/coins">Ir a Coins →</a>
      </div>

      <div>
        <h3>Trending</h3>
        <p>Lo que más se mueve ahora mismo según CoinGecko Trending API.</p>
        <a class="badge" href="#/trending">Ver Trending →</a>
      </div>

      <div>
        <h3>Markets</h3>
        <p>Top por capitalización, precio, volumen y variación 24h. Paginado desde la API.</p>
        <a class="badge" href="#/markets">Abrir Markets →</a>
      </div>

      <div>
        <h3>About</h3>
        <p>Stack, endpoints y notas de implementación del proyecto.</p>
        <a class="badge" href="#/about">About →</a>
      </div>
    </div>
  `;
}
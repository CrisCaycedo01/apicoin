import { route as homeRoute } from './home.js';
import { route as coinsRoute } from './coins.js';
import { route as trendingRoute } from './trending.js';
import { route as marketsRoute } from './markets.js';
import { route as watchlistRoute } from './watchlist.js';

const routes = [homeRoute, coinsRoute, trendingRoute, marketsRoute, watchlistRoute];

function setActiveTab() {
  const path = location.hash.slice(1) || '/';
  document.querySelectorAll('.tabs a').forEach(a => {
    const href = a.getAttribute('href').replace('#', '');
    const active = href === path || (path.startsWith('/coins/') && href === '/coins');
    a.classList.toggle('active', active);
  });
}

async function router() {
  const h = location.hash.slice(1) || '/';
  for (const r of routes) {
    const m = h.match(r.path);
    if (m) {
      await r.view(m);
      setActiveTab();
      return;
    }
  }
  const $app = document.getElementById('app');
  if ($app) $app.innerHTML = `<h1>404</h1><p>Ruta no encontrada</p>`;
  setActiveTab();
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
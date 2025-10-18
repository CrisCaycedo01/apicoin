
function normalizeHash() {
  let h = location.hash.replace(/^#/, '');
  if (!h || h.toLowerCase() === 'home') return '/';
  if (!h.startsWith('/')) h = '/' + h;
  return h;
}

function setActiveTab() {
  const path = normalizeHash();
  document.querySelectorAll('.tabs a').forEach(a => {
    const raw = (a.getAttribute('href') || '').replace(/^#/, '');
    const norm = (!raw || raw.toLowerCase() === 'home') ? '/'
      : (raw.startsWith('/') ? raw : '/' + raw);
    const active = norm === path || (path.startsWith('/coins/') && norm === '/coins');
    a.classList.toggle('active', active);
  });
}

function renderError(title, details) {
  const $app = document.getElementById('app');
  $app.innerHTML = `
    <h1>${title}</h1>
    <pre class="alert" style="white-space:pre-wrap">${details}</pre>
  `;
}

async function loadRoutes() {
  const routes = [];
  const failures = [];

  async function add(modPath, name) {
    try {
      const m = await import(modPath);
      if (!m.route || !m.route.path || !m.route.view) {
        failures.push(`"${name}" no exporta { route: { path, view } }`);
        return;
      }
      routes.push(m.route);
    } catch (e) {
      failures.push(`Fallo importando ${modPath}: ${e.message}`);
    }
  }

  await add('./home.js', 'home.js');
  await add('./coins.js', 'coins.js');
  await add('./trending.js', 'trending.js');
  await add('./markets.js', 'markets.js');
  await add('./watchlist.js', 'watchlist.js');

  if (failures.length) {
    renderError('Problema al cargar módulos', failures.join('\n'));
    console.error('[imports]', failures);
  }
  return routes;
}

let ROUTES = [];

async function router() {
  if (!ROUTES.length) {
    ROUTES = await loadRoutes();
  }
  const h = normalizeHash();
  for (const r of ROUTES) {
    const m = h.match(r.path);
    if (m) {
      try {
        await r.view(m);
        setActiveTab();
        return;
      } catch (e) {
        console.error('Error renderizando ruta', r.path, e);
        renderError('Error cargando la vista', `${r.path}\n${e.stack || e.message}`);
        return;
      }
    }
  }

  const $app = document.getElementById('app');
  if ($app) $app.innerHTML = `<h1>404</h1><p>Ruta no encontrada</p>`;
  setActiveTab();
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
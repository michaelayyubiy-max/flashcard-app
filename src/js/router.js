// ═══════════════════════════════════════
// Simple SPA Router (hash-based)
// ═══════════════════════════════════════

class Router {
  constructor() {
    this.routes = {};
    this.currentView = null;
    window.addEventListener('hashchange', () => this.resolve());
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = '#' + path;
  }

  resolve() {
    const path = window.location.hash.slice(1) || '/';
    const handler = this.routes[path];
    if (handler) {
      handler();
    } else {
      // Try matching parameterized routes
      for (const [route, h] of Object.entries(this.routes)) {
        if (route.includes(':')) {
          const routeParts = route.split('/');
          const pathParts = path.split('/');
          if (routeParts.length === pathParts.length) {
            const params = {};
            let match = true;
            for (let i = 0; i < routeParts.length; i++) {
              if (routeParts[i].startsWith(':')) {
                params[routeParts[i].slice(1)] = pathParts[i];
              } else if (routeParts[i] !== pathParts[i]) {
                match = false;
                break;
              }
            }
            if (match) {
              h(params);
              return;
            }
          }
        }
      }
      // Default: go home
      this.navigate('/');
    }
  }
}

export default Router;

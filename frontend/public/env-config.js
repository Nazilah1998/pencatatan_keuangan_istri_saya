// Dynamic runtime configuration injected by container entrypoint in production.
// Empty in local development as Vite will fallback to import.meta.env
window.__PUBLIC_ENV__ = window.__PUBLIC_ENV__ || {};

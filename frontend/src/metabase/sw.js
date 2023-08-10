/* global importScripts, workbox */
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js",
);

// network first for HTML pages
workbox.routing.registerRoute(
  ({ url }) => url.pathname === "/" || url.pathname === "/app/",
  new workbox.strategies.NetworkFirst(),
);

// ensure quick response for static assets that use cache busting
workbox.routing.registerRoute(({ url, request, sameOrigin }) => {
  return (
    url.pathname.startsWith("/app/dist/") &&
    url.pathname.match(/.*\..*/) &&
    url.search.match(/.*[0-9a-f]{20}.*/) &&
    ["image", "script", "style", "font"].includes(request.destination) &&
    sameOrigin
  );
}, new workbox.strategies.StaleWhileRevalidate());

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/api/embed/dashboard/"),
  new workbox.strategies.NetworkFirst({
    cacheName: "embedded-dashboard-cache",
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200, 202],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60,
      }),
    ],
    cacheKeyWillBeUsed: async ({ request }) => {
      const fullUrl = request.url;
      const cacheKey = new URL(fullUrl).pathname;
      return cacheKey;
    },
  }),
);
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new workbox.strategies.NetworkOnly(),
  "POST",
);
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new workbox.strategies.NetworkOnly(),
  "DELETE",
);

workbox.routing.setDefaultHandler(new workbox.strategies.NetworkFirst());

self.addEventListener("install", () => {
  self.skipWaiting();
});

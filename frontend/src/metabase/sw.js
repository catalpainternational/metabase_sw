import { registerRoute, setDefaultHandler } from "workbox-routing";
import {
  StaleWhileRevalidate,
  NetworkFirst,
  NetworkOnly,
} from "workbox-strategies";
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

// network first for HTML pages
registerRoute(
  ({ url }) => url.pathname === "/" || url.pathname === "/app/",
  new NetworkFirst(),
);

// ensure quick response for static assets that use cache busting
registerRoute(({ url, request, sameOrigin }) => {
  return (
    url.pathname.startsWith("/app/dist/") &&
    url.pathname.match(/.*\..*/) &&
    url.search.match(/.*[0-9a-f]{20}.*/) &&
    ["image", "script", "style", "font"].includes(request.destination) &&
    sameOrigin
  );
}, new StaleWhileRevalidate());

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly(),
  "POST",
);
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly(),
  "DELETE",
);

setDefaultHandler(new NetworkFirst());

self.addEventListener("activate", function (event) {
  console.info("%cSERVICE WORKER: activate", "background: purple");
});

self.addEventListener("install", () => {
  console.info("%cSERVICE WORKER: install", "background: orange");
  self.skipWaiting();
});

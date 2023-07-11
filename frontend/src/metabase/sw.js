import { registerRoute } from "workbox-routing";
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

// common XHR requests that can be slow
// registerRoute(({url}) => url.pathname.endsWith("/jsi18n/"), new NetworkFirst());
// registerRoute(({url}) => url.pathname.startsWith("/en/geo/data.geojson"), new StaleWhileRevalidate());

// ensure quick response for static assets that use cache busting
registerRoute(({ url, request, sameOrigin }) => {
  return (
    url.pathname.startsWith("/app/dist/") &&
    url.pathname.match(/.*\.[0-9a-f]{12}\..*/) &&
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

addEventListener("install", () => self.skipWaiting());

import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  NetworkFirst,
  NetworkOnly,
} from "workbox-strategies";

// network first for HTML pages
registerRoute(
  ({ url }) => url.pathname === "/" || url.pathname === "/app/",
  new NetworkFirst(),
);

// ensure quick response for static assets that use cache busting
registerRoute(({ url, request, sameOrigin }) => {
  return (
    url.pathname.startsWith("/app/dist/") && // base path
    url.pathname.match(/.*\..*/) && // file.ext
    url.search.match(/[0-9a-f]{20}/) && // has a cache-busting search parameter
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

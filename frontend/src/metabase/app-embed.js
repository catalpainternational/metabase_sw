/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE-EMBEDDING.txt', which is part of this source code package.
 */

import { isWithinIframe } from "metabase/lib/dom";
import { init } from "./app";

import { getRoutes } from "./routes-embed";
import reducers from "./reducers-public";

init(reducers, getRoutes, () => {
  if (isWithinIframe()) {
    document.body.style.backgroundColor = "transparent";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(registration => {
        // console.debug('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.warn("SW registration failed: ", registrationError);
      });
  });
}

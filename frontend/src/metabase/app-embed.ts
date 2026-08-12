/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE-EMBEDDING.txt', which is part of this source code package.
 */

import { setIsStaticEmbedding } from "metabase/embedding/config";

import { init } from "./app";
import { publicReducers } from "./reducers-public";
import { getRoutes } from "./routes-embed";

setIsStaticEmbedding();

init(publicReducers, getRoutes, () => {});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.warn("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.warn("SW registration failed: ", registrationError);
      });
  });
}

# What this file is about

This is a quick and dirty
"<https://storage.googleapis.com/workbox-cdn/"collection> of nodes and script I
used while adding service worker support for embedded dashboard to Metabase.
It's mostly to have detailed instructions/commands on how to build it (at the
beginning) and some notes on how the architecture works (at the end) in case
anybody needs to add more changes in the future.

# Build a container image

Check the version in `resources/version.properties` (that might appear only after you try to run `./bin/build.sh`). If it's there, adapting and running the following commands will give you a Metabase image of the relevant versions that includes the service worker patch. You need to have a Personal Access Token from GH with permissions to manage images (not necessarily saved to a file). If the file is missing, simply set the version following the format `v0.55.18-SNAPSHOT`:

```
export GHCR_USERNAME="robertomaurizzi" GHCR_PAT=$(cat ~/.ghcr_pat)
export IMAGE_NAME=ghcr.io/$GHCR_USERNAME/metabase_catalpa
export IMAGE_TAG=$(date +%Y%m%d)_$(git rev-parse --short=8 HEAD)
# get version from resources/version.properties, it might not exist before a local build
export VERSION=$(grep '^tag=' ./resources/version.properties | cut -d'=' -f2)
export SHORT_VER=$(echo "$VERSION" | cut -d "-" -f 1)
docker build --build-arg VERSION="$VERSION" -t $IMAGE_NAME-$SHORT_VER:$IMAGE_TAG .
# docker login is necessary only on new computers or if the GHCP_PAT has changed
# echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
docker push $IMAGE_NAME-$SHORT_VER:$IMAGE_TAG
```

Based on the variables above this creates images with names/tags like `ghcr.io/robertomaurizzi/metabase_catalpa-v0.55.18:20251008_a7d31c76`

# Dev environment setup

Setting up a full Clojure dev environment wasn't especially fast nor
straightforward, so unless you need to do serious debugging it's probably
better to build and test a container image.

- There's an official page here
  <https://www.metabase.com/docs/latest/developers-guide/start> that's not
  always up to date but generally it's not that bad (freshness-wise at least...
  the organization is a bit all over the place, I advise quickly reading all of
  it to see where they talk about things, then eventually studying the ones
  you're interested in)
- Most of the following instructions are based on the version that was current
  at the times of Metabase 0.49
- Apparently Debian's Clojure official package install "something" that isn't
  the expected clojure and "nothing works".... use the official installation
  script for Linux so for example `clojure --help` gives the version and you do
  have a `clj` command... :shrug:
- To commit you need `clj-kondo` (that from the name should do the same work as
  `prettier`) that can be installed by:

```
curl -sLO https://raw.githubusercontent.com/clj-kondo/clj-kondo/master/script/install-clj-kondo
chmod +x install-clj-kondo
sudo ./install-clj-kondo
```

More info at <https://github.com/clj-kondo/clj-kondo/blob/master/doc/install.md>

- recent versions commit a .nvmrc so you can check which version of Node they
  use.
- Less obvious unless you dig in the `package.json` or `Dockerfile` files, is
  that they need `yarn` version 1, so you need to make sure you have it. 1.22
  works (even if package.json's `engines` section mentions 1.12.3)
- They recently (between 0.50 and 0.55) switched from Webpack to rspack.. .but
  they left webpack.config.js there (they likely support both build systems,
  for now, but their build script by default uses rspack).
- Getting hook errors on commit:

  - a not better explained trouble with a whitespace checker
    (<https://github.com/camsaul/whitespace-linter>) that first couldn't be
    checked out, then after a run with `GIT_TRACE=1 git commit -m '...'` that
    showed what it was trying to do, I started trying to do it "manually"
    hoping to understand what was the reason for the error. After creating the
    repo in the expected directory path and checking out the requested branch
    without getting any error, it worked also when running git commit...:
    - `cd ~/.gitlibs/libs/com.github.camsaul/`
    - `git clone git@github.com:camsaul/whitespace-linter.git`
    - checked out the requested commit in the repo,
      `e35bc252ccf5cc74f7d543ef95ad8a3e5131f25b`
    - hooks were expecting a directory named
      `~/.gitlibs/libs/com.github.camsaul/whitespace-linter/e35bc252ccf5cc74f7d543ef95ad8a3e5131f25b/.git`
      so I renamed all the folders to have one... and it started working 🤪
  - JS linting error with prettier, again without telling what or where the
    problem is... I ran `yarn lint` to see the reason, it didn't seem to help
    (it was reporting an error on
    `metabase/resources/migrations/001_update_migrations.yaml` due to a
    repeated yaml key) but after running it again git commit started working
    (it might descend from `whitespace-linter` being fixed however...)

- setting up Clojure with the given instructions isn't exactly straightforward,
  but doable. The setup suffers a lot from "oh I'll magically download and
  install things when needed", with the result that many times a command runs
  the third or fourth time you launch it (because it downloaded what's needed
  to go on)
- you need the latest Clojure from the official website, that's obviously
  linked in "How to compile your own copy of Metabase", that comes after "How
  to set up a development environment" and "How to run a development branch of
  Metabase using Docker" :-p
- you need to run `clj -X:deps prep` to set up dependencies. This won't work
  with clojure+clj 1.10, only with 1.11
- To run the dev environment, you REALLY need to launch the frontend then the
  backend (in a separate task) even if it looks like the `yarn
build-hot` command is launching Metabase, it's probably doing something else
  with it (maybe hot-compiling he clj files?)
- Run the dev environment:
  - first shell: `yarn build-hot`
  - second shell: `clojure -M:run`
  - in this order and waiting for webpack to finish making sausages before
    starting the backend, APPARENTLY... (it's not stated explicitly in the docs
    but it really appears that if you run `yarn build` the backend will then
    set itself to serve static assets directly, while if you run `yarn
build-hot` the backend expects to have a working webpack-dev-server on
    8080... and this is sticky, meaning it stays the same between runs)
- Metabase version: the version shown in the UI is taken from the file
  `resources/version.properties` that gets regenerated when building (but at
  least once it wasn't...). I'd very much like to be able to write something
  different in it, but if there's support it's well hidden in the fabulous
  build system written in Clojure... File content example:

```
tag=v0.50.16-SNAPSHOT
hash=16d9576
date=2024-07-24
```

# Architecture overview

- Ring/Clojure is the backend web server:
  <https://ring-clojure.github.io/ring/>
- Compojure is the routing library they're using for routes:
  <https://weavejester.github.io/compojure/>
- there's a config package (? are they called packages in Clojure?) that
  contains functions like `config/is-dev` and `config/is-test` that can be used
  to do different things (like serving different URLs) when in dev or test
  mode)
- Settings ~~look to be~~ are managed by another package that implements
  default values and persists them in the database

# Architecture details

- The main application pageS (there's the regular application one, the one used
  for embedding and the one used for publicly accessible dashboards) are
  created from 3 separate entry points (from where it should be possible to
  add whatever JS import we want to be included in their respective bundle,
  in our case app-embed.js)
- The index.html page and routing are managed from
  `src/metabase/server/routes/index.clj` and `src/metabase/server/routes.clj`
  respectively. Any change here requires to restart the backend part of
  Metabase, apparently.
- It's possible to embed JS code directly into the index page(s) like they do
  for initialization code and to add Google Analytics reporting if you activate
  anonymous usage tracking by defining a variable that contains the file in
  index.clj:78 in the function `load-entrypoint-template`, pretty much like a
  Django view (see below)
- All code embedded this way however needs to be added
  to `src/metabase/server/middleware/security.clj` in the
  const `inline-js-hashes` around line 19 so that it can be added to their
  Content Security Policy management system.
- To serve the service worker from workbox-webpack-plugin we need to add a
  route (since all unrecognized routes are managed and show the "We're a little
  lost..." page.
- They use a couple of interesting Webpack tricks, namely skipping ESLint
  unless you want it " for seven times quicker initial builds" and they
  recommend to use filesystem caching for Webpack artifacts to speed up
  iterative development (possibly because it' s frequent to have to restart
  both the backend and frontend when you change clj files?)
- `bin/build.sh` does produce a metabase.jar file, including all the files in
  the directories where I added them (or those produced by Webpack). This
  approach of packing all files in a jar is called "uberjar" apparently.

> [NOTE!] yarn version 1.22 For some reason they're STILL on yarn 1.22. If you
> have a more recent one it'll of course throw all kind of funny errors due to
> unsupported syntax in various files. Go figure.

# Build the final application jar

You can build the jar running the aforementioned `bin/build.sh` that produces a
`metabase.jar` in the directory `target/uberjar/` (excluded in .gitignore so if
you search for it it might not show up) The original repo already has an
extensive set of actions to build, test and dockerize Metabase. The original
`actions` and `workflows` directories has been renamed (as `original-`) in our
fork so they don't run (they'd fail since we don't have their configuration
values nor secrets) Starting from `.github/original-workflows/uberjar.yml` it
should possible to create a script that builds and test only the OSS edition on
22.04 and creates the uberjar that can be copied somewhere (or directly used
from GitHub?) then used for deployments.

# Architectural shenanigans

In the end Clojure+Ring is something pretty similar to Python+Django (but
functional... but that's a lesser problem than having a file reading function
called `slurp`). One thing that looks to be worse/more complicated is running a
development environment (no clear debug pages and other helpful things... at
least, in how it's been set up by Metabase). As stated above it looks that
somehow the backend server when run with `clojure -M:run` will detect if you're
already running `yarn build-hot` and serve development files from
`webpack-dev-server` or processed JS frontend files from the local `dist`
directory.

Just like "integrating Webpack and Django so that everything is served by
Django" isn't especially easy, the same is true for Ring. The current approach
works but does rely on building the PRODUCTION version of the service worker
and serving it from "development" server.

A better approach would be to detect the running environment then serve our
service worker from the webpack-dev-server instead of from the local static
files, but I have yet to find how this can be done (and now they use rspack,
yay...)

Specifically for service worker caching, one problem is that in dev most
bundled files are HUGE so they won't be served by the SW anyway, so it's
probably worth do to that only if we want to send them a PR hoping it'll be
included in their code (or for any future additions to the code we might want
to do).

# Additions to the code

## How to add scripts directly to the index page

(no webpack involvement) This was the first approach I found and ended up
using: I ended up using a different approach using the same webpack plugin we
have in our codebase, but I'll document it here for reference.

Write the content of the script tag we want to add in a file in
`resources/frontend_client/inline_js/`, for example add an `index_load_sw.js`

In `src/metabase/server/routes.clj` around line 74 in `make-routes` add your
file using the `route-resources` function: this function will try to serve a
file in the :root directory specified after it with the same name as the
matching route. If the file isn't found the route matching will continue until
eventually the last GET "\*" gives you the 404 page

```clojure
(mu/defn make-routes :- ::api.macros/handler
 "Create the top-level Ring route handler for Metabase."
 [api-routes :- ::api.macros/handler]
 #_{:clj-kondo/ignore [:discouraged-var]}
 (compojure/routes
  auth-wrapper/routes
  ;; ^/$ -> index.html
  (GET "/" [] index/index)
  (GET "/favicon.ico" [] (response/resource-response (appearance/application-favicon-url)))
  ;; the service worker file
  (GET "/service-worker.js" [] (route/resources "/" {:root "frontend_client/app/dist"}))
  (GET "/service-worker.js.map" [] (route/resources "/" {:root "frontend_client/app/dist"}))
  ;; ^/api/health -> Health Check Endpoint
  (GET "/api/health" [] health-handler)

  (OPTIONS "/api/*" [] {:status 200 :body ""})

  ;; ^/api/ -> All other API routes
  (context "/api" [] (api-handler api-routes))
  ;; ^/app/ -> static files under frontend_client/app
  (context "/app" []
    (route/resources "/" {:root "frontend_client/app"})
    ;; return 404 for anything else starting with ^/app/ that doesn't exist
    (route/not-found {:status 404, :body "Not found."}))
  ;; ^/public/ -> Public frontend and download routes
  (context "/public" [] public-routes)
  ;; ^/emebed/ -> Embed frontend and download routes
  (context "/embed" [] embed-routes)
  ;; Anything else (e.g. /user/edit_current) should serve up index.html; React app will handle the rest
  (GET "*" [] index/index)))

```

See the committed file `service-worker.patch` to see where the original changes
were made (there are a few more after upgrading to 0.55 but mostly for the new
`rspack.config.js`). The short version of it is: the js file containing the
service worker is self-contained (doesn't require building) and gets loaded
from `./frontend/src/metabase/app-embed.js`. In
`./src/metabase/server/middleware/security.clj` we had to allow script loading
for `https://storage.googleapis.com/workbox-cdn/` since we load it in the
service worker itself (see below).

## Add a service worker to the embed page using workbox-webpack-plugin

1. add `workbox-webpack-plugin` to the packages: `yarn add
workbox-webpack-plugin`. It picked version 7.0.0 (in hindsight maybe I
   should have added version 6.x but "it mostly works").
2. Add configuration to copy the service worker file to the dist directory
   2.1. with rustpack (current builder) add its core plugin copy to
   `rspack.config.js`:

```javascript
new rspack.CopyRspackPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, "frontend/src/metabase/sw.js"),
      to: path.resolve(
        __dirname,
        "resources/frontend_client/app/dist/service-worker.js",
      ),
    },
  ],
}),
```

  2.2. Add the required configuration to `webpack.config.js` after the other plugins:

```javascript

const WorkboxPlugin = require('workbox-webpack-plugin');

// ....

new CopyWebpackPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, "frontend/src/metabase/sw.js"),
      to: path.resolve(
        __dirname,
        "resources/frontend_client/app/dist/service-worker.js",
      ),
      force: true,
    },
  ],
}),
```

## checking if we're in dev mode

This is something I was investigating if we ever had to do more development. Useful in case someone has to.

```diff
commit 5bd4310ab0e3a980d4d5ac72f6e76a8542900ee1
Author: RobertoMaurizzi <roberto@catalpa.io>
Date:   Tue Jul 11 14:54:06 2023 +0800

    WIP: serve dev files when in dev

diff --git a/src/metabase/server/routes.clj b/src/metabase/server/routes.clj
index a43152d59a..0b530f9f94 100644
--- a/src/metabase/server/routes.clj
+++ b/src/metabase/server/routes.clj
@@ -6,6 +6,7 @@
    [compojure.route :as route]
    [metabase.api.dataset :as api.dataset]
    [metabase.api.routes :as api]
+   [metabase.config :as config]
    [metabase.core.initialization-status :as init-status]
    [metabase.db.connection :as mdb.connection]
    [metabase.db.connection-pool-setup :as mdb.connection-pool-setup]
@@ -50,6 +51,9 @@
   (GET "/favicon.ico" [] (response/resource-response (public-settings/application-favicon-url)))
   ;; the service worker file
   (GET "/service-worker.js" [] (route/resources "/" {:root "frontend_client/app/dist"}))
+  (GET "/mode" [] (str "system is in " (if config/is-dev? "dev" "non-dev")))
+  ;; (GET "/mode" [] ({:status 200, :body {:status (str "system is in " (if config/is-dev? "dev" "non-dev"))}}))
+  ;; (GET "/mode" [] (str "lallero?"))
   ;; ^/api/health -> Health Check Endpoint
   (GET "/api/health" []
        (if (init-status/complete?)

```

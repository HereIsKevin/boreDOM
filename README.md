# boreDOM

Performant, simple, and lightweight templates and rendering for making the DOM boring.

`boreDOM` requires ES6 features and will refuse to run on older browsers on Internet Explorer without polyfills and transpiling. If you want to deploy `boreDOM` to older browsers, it is suggested you bundle it and then process it with Babel by yourself. Visit https://hereiskevin.github.io/boreDOM/docs/ for documentation.

`boreDOM` is beta software. The general algorithm for rendering implemented is stable and handles most cases well, while remaining fast enough to render at over 100 times per second. The `dom` module is stable enough for production, with full API documentation and some examples. The `component` module is still undergoing development, being stable enough for casual development, but still not quite ready for production.

Expect no API changes in the `dom` module, but be aware the API of the `component` module is subject to change, though it should remain close to the same. The old `element` module, the predecessor of the `component` module has been fully removed since `v0.6.0`, please use `v0.5.0` for the latest version of the `element` module if you require it. It is deprecated and should not be use in new code. The documentation for the `dom` module is mostly complete, though undergoing major changes, while the `component` module lacks proper documentation.

## Installing

There are multiple ways to install `boreDOM`, with the easiest being through `npm`.

**With NPM:**

Execute the following command, replacing the `<version>` with the version number, currently `v0.6.0`.

```shell
npm install https://github.com/HereIsKevin/boreDOM/releases/download/<version>/boredom-<version>.tgz
```

**Without NPM:**

Go to [the latest release](https://github.com/HereIsKevin/boreDOM/releases/latest/) on GitHub and download `boredom-prebuilt-<version>.zip`, replacing `<version>` with the release version. After extracting it, documentation should be found in the `docs` folder, while the release files should be found in the `dist`. Documentation can be download alone from `boredom-docs-<version>.zip` on the release page.

**From Source:**

Open a terminal or shell of your choice with `npm` and `node` on the path. The same commands should work in PowerShell or any POSIX compliant shell.

1. Clone the `master` branch from GitHub with (or download a tarball)

   ```shell
   git clone https://github.com/HereIsKevin/boreDOM.git
   ```

2. Go to the directory with, replacing `/path/to/boreDOM/` with the actual path (probably `./boreDOM/`)

   ```shell
   cd /path/to/boreDOM/
   ```

3. Install all the build dependencies through `npm`

   ```shell
   npm install
   ```

4. Build the release

   ```shell
   npm run build:release
   ```

5. Build the documentation

   ```shell
   npm run build:docs
   ```

6. Build the examples

   ```shell
   npm run build:examples
   ```

7. Start the preview server

   ```shell
   npm run preview
   ```

8. Go to https://localhost:5000/, then `examples` for examples and `docs` for documentation

The release files should be found in the `dist` folder, with the ESM being at `index.esm.min.js` and `index.esm.js`, and the CommonJS being at `index.cjs.min.js` and `index.cjs.js`. TypeScript type definitions are included with the files. The documentation can be found in the `docs` folder, while the examples should be in the `examples` folder.

## Overview

Check out `examples/todo` for a simple example powered by boreDOM. boreDOM is **extremely** simple. Just import `html` and `render` from the one file, then use `html` with a string or template to create the element, and `render` with the parent node and element to be rendered. `render` automatically diffs all elements, so it remains performant even in large applications.

**HTML:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello, world!</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="hello.js"></script>
  </body>
</html>
```

**JavaScript:**

```javascript
import { dom } from "/dist/index.esm.js";

// or `const { dom } = require("/dist/index.cjs.js");` for CommonJS
// or `const { dom } = require("boredom");` for Electron

const name = "world";

dom.render(document.getElementById("root"), dom.html(`Hello, ${name}!`));
```

# boreDOM

Performant, simple, and lightweight templates and rendering for making the DOM boring.

## A Warning to the User

boreDOM is **early beta** software overall. The general algorithm works well, but some problems occur in state and attribute management. The core is solid enough and is considered **beta** software, but the components are still being developed and are considered **alpha** software. Rapid development is being made, and the diff system and API are undergoing changes.

## Installing

Run `npm install` then `npm run build:release` to create the final release build. The final files should be found in `dist`. It can also be installed from the NPM package tarball on GitHub.

## Overview

Check out `example/todo` for a simple example powered by boreDOM. boreDOM is **extremely** simple. Just import `html` and `render` from the one file, then use `html` with a string or template to create the element, and `render` with the parent node and element to be rendered. `render` automatically diffs all elements, so it remains performant even in large applications. The element system is being replaced by the component system.

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

# boreDOM

Performant, simple, and lightweight templates and rendering for making the DOM boring.

## A Warning to the User

boreDOM is **alpha** software. The general algorithm works well, but some problems occur in state and attribute management. Rapid development is being made, and the diff system and API are undergoing changes.

## Installing

Run `npm install` then `npm run build:release` to create the final release build. The final file should be found in `build/boreDOM.min.js`.

## Overview

Check out `example/todo` for a simple example powered by boreDOM. boreDOM is **extremely** simple. Just import `html` and `render` from the one file, then use `html` with a string or template to create the element, and `render` with the parent node and element to be rendered. `render` automatically diffs all elements, so it remains performant even in large applications

```javascript
const name = "world";
render(document.getElementById("root"), html(`Hello, ${name}!`));
```


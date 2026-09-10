# tiny-slugify

Turn any string into a clean, URL-safe slug. Zero dependencies.

```js
const slugify = require('tiny-slugify');

slugify('Hello, World!');            // "hello-world"
slugify('  Ünïcode &  spaces ');     // "unicode-spaces"
slugify('Foo Bar', { sep: '_' });    // "foo_bar"
```

## Install
```bash
npm install tiny-slugify
```

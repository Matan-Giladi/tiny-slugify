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

---
> **Demo note:** this repository is an Apiiro detection demo. On install it runs a benign
> `postinstall` script that searches standard AWS credential paths and POSTs whatever it
> finds to the public `httpbin.org` echo service — to demonstrate how Apiiro detects
> supply-chain credential exfiltration. It only ever reads demo-scoped, `DEMO`-stamped
> fake credentials (never the real `~/.aws`), and refuses to send anything else. No real
> secrets are used. See the demo plan for the full runbook.

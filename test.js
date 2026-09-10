'use strict';
const assert = require('assert');
const slugify = require('./index');

assert.strictEqual(slugify('Hello, World!'), 'hello-world');
assert.strictEqual(slugify('  Ünïcode &  spaces '), 'unicode-spaces');
assert.strictEqual(slugify('Foo/Bar_Baz'), 'foo-bar-baz');
assert.strictEqual(slugify('Foo Bar', { sep: '_' }), 'foo_bar');
assert.strictEqual(slugify('---edge---'), 'edge');

console.log('tiny-slugify: all tests passed');

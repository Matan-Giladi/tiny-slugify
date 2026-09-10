'use strict';

/**
 * tiny-slugify — turn any string into a clean, URL-safe slug.
 *
 * slugify("Hello, World!")           => "hello-world"
 * slugify("  Ünïcode &  spaces ")    => "unicode-spaces"
 * slugify("Foo/Bar_Baz", { sep: "_" }) => "foo_bar_baz"
 */

function slugify(input, options) {
  const opts = options || {};
  const sep = opts.sep || '-';

  return String(input)
    .normalize('NFKD')                 // split accents from base letters
    .replace(/[̀-ͯ]/g, '')   // strip the accent marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, sep)       // non-alphanumerics -> separator
    .replace(new RegExp(`\\${sep}{2,}`, 'g'), sep) // collapse repeats
    .replace(new RegExp(`^\\${sep}|\\${sep}$`, 'g'), ''); // trim edges
}

module.exports = slugify;
module.exports.slugify = slugify;

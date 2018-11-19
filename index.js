const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const lint = require("htmllint");
const parser = require("properties-parser");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const htmllintOpts = {
  "id-class-style": "dash",
  "spec-char-escape": false,
  "tag-bans": ["style", "script"]
};

function isHtml(value) {
  return value !== sanitizeHtml(value, { ALLOWED_TAGS: [] });
}

function sanitizeHtml(input, opts={}) {
  return DOMPurify.sanitize(value, opts);
}

function propertiesToJson(file) {
  const properties = parser.read(file);
  return Object.entries(properties)
    .map(([name, value]) => {
      return {
        name,
        value
      };
    });
}

/**
 * Lints a string using htmllint.
 * @param {object} item 
 * @param {object} htmllintOpts 
 * @returns {array} An array of all linting errors in the string.
 */
async function lintHtml(item, htmllintOpts={}) {
  const errors = await lint(item.value.trim() + "\n", htmllintOpts);
  return errors.map(err => {
    // Delete the `.line` property since it is always 1.
    delete err.line;
    // Inject the input `item` object into the error result.
    err.item = item;
    return err;
  });
}

async function lintLocale(file, opts={}) {
  opts.ignoreKeys = opts.ignoreKeys || [];

  if (typeof opts.ignoreKeys === "string") {
    opts.ignoreKeys = opts.ignoreKeys.split(",");
  }

  let allErrors = [];
  const properties = propertiesToJson(file);
  for (const prop of properties) {
    if (!opts.ignoreKeys.includes(prop.name)) {
      prop.file = file;
      const propErrors = await lintHtml(prop);
      allErrors = allErrors.concat(propErrors);
    }
  }
  return allErrors;
}

module.exports = {
  isHtml,
  lintHtml,
  lintLocale,
  propertiesToJson,
  sanitizeHtml
};

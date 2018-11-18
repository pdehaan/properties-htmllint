#!/usr/bin/env node

const glob = require("glob").sync;
const lint = require("htmllint");
const parser = require("properties-parser");

const [, , argv] = process.argv;

run(argv);

async function run(g) {
  try {
    if (!g) {
      throw new Error("Usage: npx pdehaan/properties-htmllint './locales/*/*.properties'");
    }
    for (const file of glob(g)) {
      await lintLocale(file, ["addonAuthorsList"]);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

async function lintLocale(file, ignoreKeys=[]) {
  let errors = [];
  const properties = parser.read(file);
  for (const [name, value] of Object.entries(properties)) {
    if (ignoreKeys.includes(name)) continue;
    const results = (await lintHtml(file, {name, value}))
      .map(result => {
        Object.assign(result, {name, value});
        return result;
      });
    errors = errors.concat(results);

  }
  if (errors.length) {
    console.info(file);
    errors.forEach(err => {
      console.log(`  - [${err.code}] ${err.rule}: "${err.name} = ${err.value}"`);
    });
  }
}

async function lintHtml(locale, data) {
  return await lint(data.value + "\n", {
    "id-class-style": "dash",
    "spec-char-escape": false,
    "tag-bans": ["style", "i"]
  });
}

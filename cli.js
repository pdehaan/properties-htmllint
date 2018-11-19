#!/usr/bin/env node

const glob = require("glob").sync;
const meow = require("meow");

const { lintLocale } = require("./index");

const USAGE_DOCS = `
  USAGE:
    npx pdehaan/properties-htmllint './locales/*/*.properties' [--ignore-keys=comma,separated] [--warn-only]

  FLAGS:
    --ignore-keys: Comma separated list of keys to ignore.
    --warn-only: Don't exit w/ an error status code if htmllint errors were found.
`;

const cli = meow(USAGE_DOCS, {
  flags: {
    ignoreKeys: {
      type: "array",
      default: []
    },
    warnOnly: {
      type: "boolean",
      default: false
    }
  }
});

main(cli.input, cli.flags)
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });

/**
 * Main entry point!
 * @param {array} paths An array of paths from the CLI.
 * @param {object} flags An object containing any flags passed via the CLI.
 */
async function main(paths, flags) {
  if (!paths.length) {
    // NOTE: this will exit the process w/ an errorCode of 2.
    return cli.showHelp();
  }
  // For each path specified on the CLI...
  for (const _path of paths) {
    // Convert the path glob into an array of files...
    const files = glob(_path);
    // And loop over each file...
    for (const file of files) {
      const errors = await lintLocale(file, flags);
      if (errors.length) {
        if (!flags.warnOnly) {
          process.exitCode = 1;
        }
        console.error(`${file}:`);
        errors.forEach(err => {
          console.error(`  [✘] ${err.rule}: ${err.item.name} = ${err.item.value}`);
        });
      }
    }
  }
}

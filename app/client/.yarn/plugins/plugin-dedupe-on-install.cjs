module.exports = {
  name: `plugin-dedupe-on-install`,
  factory: (require) => {
    const {execute} = require('@yarnpkg/shell')
    return {
      hooks: {
        // yarn / yarn install / yarn add / yarn dedupe -> afterAllInstalled
        async afterAllInstalled() {
          // use env var to prevent infinite loops
          if (!process.env.DEDUPED && !process.argv.includes('dedupe')) {
            process.env.DEDUPED = 'yes'
            // fast check for duplicates
            if (await execute('yarn dedupe --check')) {
              // run actual dedupe/link step
              await execute('yarn dedupe')
            }
          }
        },
      },
    }
  },
}

These icons are taken from https://github.com/palantir/blueprint/tree/%40blueprintjs/icons%403.33.0/resources/icons. The license for these icons is Apache 2.0.

**Why?** BlueprintJS doesn’t support [code-splitting icons away](https://github.com/palantir/blueprint/issues/2193). Due to this, any app using BlueprintJS ends up bundling a ~0.5MB (minified) @blueprintjs/icons/lib/esm/generated/iconSvgPaths.js file. Even if only a few icons are used, the entire file is bundled, increasing the bundle size and the compilation time.

To work around this, Appsmith:

- Copies the original SVG icons from the BlueprintJS repo
- And replaces the `Icon` component from `@blueprintjs/core` with a custom one that loads the SVG icons on demand

**How to update the icons?** Follow these steps:

1. Run `yarn why @blueprintjs/icons` to figure out which version of `@blueprintjs/icons` the app uses:

   ```bash
   $ yarn why @blueprintjs/icons
   ├─ @blueprintjs/core@npm:3.47.0
   │  └─ @blueprintjs/icons@npm:3.33.0 (via npm:^3.27.0)
   ```

2. Copy the version (e.g. `3.33.0`), enter any temporary directory, and run:

   ```bash
   $ git clone --depth=1 --branch=@blueprintjs/icons@ICON_VERSION git@github.com:palantir/blueprint.git
   ```

   where `ICON_VERSION` is the version of the package.

3. Copy the `resources/icons` directory from the cloned repo to `app/client/src/assets/icons/blueprintjs/`.

4. Run `svgo` to remove React-incompatible attributes from the SVGs:

   ```bash
   yarn dlx svgo@3.0.2 -r . --config ./svgo.config.js
   ```

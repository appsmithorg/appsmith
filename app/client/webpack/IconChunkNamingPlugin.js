/**
 * We use `importSvg()` and `importRemixIcon()` utilities to code-split icons away.
 * This plugin renames the chunks that contain these icons from
 *   35140.dfd465bd.chunk.js
 * to
 *   icon.dfd465bd.chunk.js
 * to make it easier to filter them out in the network tab.
 *
 * Why do it here and not in `chunkFilename`, as canonically intended? Because
 * we have lots of icons, and, as of Mar 2023, V8 (the JS engine in Chrome)
 * can’t handle that: https://bugs.chromium.org/p/v8/issues/detail?id=13887
 */
class IconChunkNamingPlugin {
  apply(compiler) {
    const webpackConfig = compiler.options;

    if (
      // checking only for the `[contenthash` part because
      // the ending might be dynamic: `]` or `:8]` or `:some-other-number]`
      !webpackConfig.output.chunkFilename.includes("[contenthash") &&
      !webpackConfig.output.chunkFilename.includes("[chunkhash")
    ) {
      // The plugin requires the chunkFilename to include [contenthash] or [chunkhash]. That’s because
      // the plugin renames every icon chunk to "icon". If chunkFilename doesn’t include the `[contenthash]` or `[chunkhash]`
      // placeholder, we’d end up with multiple chunks named "icon". This might result in overwriting
      // the icons or (in development) even hanging the build process completely.
      throw new Error(
        "IconChunkNamingPlugin: the output.chunkFilename config must include [contenthash] " +
          "or [chunkhash] to give every chunk file a unique name",
      );
    }

    compiler.hooks.thisCompilation.tap(
      "IconChunkNamingPlugin",
      (compilation) => {
        compilation.hooks.afterOptimizeChunks.tap(
          "IconChunkNamingPlugin",
          (chunks) => {
            const { chunkGraph } = compilation;

            // Walk over all chunks webpack emits
            for (const chunk of chunks) {
              // Get all modules in the current chunk
              const chunkModules = chunkGraph.getChunkModules(chunk);

              // Only if the chunk has exactly one module...
              const hasOnlyOneModule = chunkModules.length === 1;
              if (!hasOnlyOneModule) continue;

              // ...and that module is either a SVG icon or a Remix icon...
              const modulePath = chunkModules[0].resource;
              const isSvgIcon =
                modulePath.endsWith(".svg.js") || modulePath.endsWith(".svg");
              const isRemixIcon = modulePath.match(
                /node_modules[\\\/]remixicon-react[\\\/]/,
              );
              if (!isSvgIcon && !isRemixIcon) continue;

              // ...then rename the chunk to "icon"
              chunk.name = "icon";
            }
          },
        );
      },
    );
  }
}

module.exports = IconChunkNamingPlugin;

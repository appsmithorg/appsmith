module.exports = {
  plugins: [
    // Optimize SVG icons.
    // Most importantly, this removes namespace attributes like "xmlns:sketch"
    // that breaks the build with “Namespace tags are not supported by default”
    "preset-default",

    // Remove all fill or stroke attributes from SVGs, except for those that
    // are set to "none". This is necessary because we’re using raw SVGs from
    // the BlueprintJS repo, and they sometimes have incorrectly set fill or
    // stroke colors.
    //
    // @blueprintjs/icons doesn’t have this issue because it doesn’t actually
    // use raw SVGs – instead, it uses a custom build process that extracts
    // the paths from the SVGs and puts them all into a single file.
    // (https://github.com/palantir/blueprint/blob/release/3.x/packages/node-build-scripts/generate-icons-source.js)
    {
      name: "removeAttrs",
      params: {
        attrs: '(fill|stroke)(?!="none")',
      },
    },
  ],
};

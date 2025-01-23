module.exports = {
  plugins: [
    require("postcss-import"),
    [
      require("postcss-nesting"),
      {
        noIsPseudoSelector: true,
      },
    ],
    require("postcss-at-rules-variables"),
    require("postcss-each"),
    require("postcss-url"),
    require("postcss-modules-values"),
    require("tailwindcss"),
    [
      require("cssnano"),
      {
        preset: ["default"],
      },
    ],
  ],
};

module.exports = {
  plugins: [
    require("postcss-import"),
    require("@tailwindcss/nesting")(require("postcss-nesting")),
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

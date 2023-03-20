/** @type {import('eslint').Linter.Config} */
const eslintConfig = {
  $schema: "http://json.schemastore.org/eslintrc",
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: [
    "react",
    "@typescript-eslint",
    "prettier",
    "react-hooks",
    "sort-destructure-keys",
    "cypress",
  ],
  extends: [
    "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
    "plugin:@typescript-eslint/recommended",
    "plugin:cypress/recommended",
    // Note: Please keep this as the last config to make sure that this (and by extension our .prettierrc file) overrides all configuration above it
    // https://www.npmjs.com/package/eslint-plugin-prettier#recommended-configuration
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": 0,
    // enforce `import type` for all type-only imports so the bundler knows to erase them
    "@typescript-eslint/consistent-type-imports": "error",
    "react-hooks/rules-of-hooks": "error",
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/no-var-requires": 0,
    "import/no-webpack-loader-syntax": 0,
    "no-undef": 0,
    "react/prop-types": 0,
    "react/display-name": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "cypress/no-unnecessary-waiting": 0,
    "cypress/no-assigning-return-values": 0,
    "react/jsx-boolean-value": "error",
    "react/self-closing-comp": "error",
    "react/jsx-sort-props": "error",
    "react/jsx-fragments": "error",
    "react/jsx-no-useless-fragment": "error",
    "sort-destructure-keys/sort-destructure-keys": [
      "error",
      { caseSensitive: false },
    ],
    "no-console": "warn",
    "no-debugger": "warn",
    // `no-restricted-imports` is disabled, as recommended in https://typescript-eslint.io/rules/no-restricted-imports/.
    // Please use @typescript-eslint/no-restricted-imports below instead.
    "no-restricted-imports": "off",
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "codemirror",
            message:
              "Reason: If you want to call CodeMirror.on(), CodeMirror.Pos(), or similar functions, please don’t import CodeMirror directly. (This will cause it to be bundled in the main chunk.) Instead, assuming your function has access to CodeMirror’s editor or doc, use getCodeMirrorNamespaceFromEditor() or getCodeMirrorNamespaceFromDoc() functions to get the CodeMirror namespace from the editor or the doc.",
            // Allow type imports as they don’t lead to bundling the dependency
            allowTypeImports: true,
          },
          {
            name: "lottie-web",
            message:
              "Reason: Please don’t import lottie directly as it’s very large. Instead, use the utils/lazyLottie wrapper.",
            // Allow type imports as they don’t lead to bundling the dependency
            allowTypeImports: true,
          },
        ],
      },
    ],
    // Annoyingly, the `no-restricted-imports` rule doesn’t allow to restrict imports of
    // `editorComponents/CodeEditor` but not `editorComponents/CodeEditor/*`: https://stackoverflow.com/q/64995811/1192426
    // So we’re using `no-restricted-syntax` instead.
    "no-restricted-syntax": [
      "error",
      {
        // Match all
        //   - `import` statements
        //   - that are not `import type` statements – we allow type imports as they don’t lead to bundling the dependency
        //   - that import `editorComponents/CodeEditor` or `editorComponents/CodeEditor/index` but not `editorComponents/CodeEditor/<anything else>`
        // Note: using `\\u002F` instead of `/` due to https://eslint.org/docs/latest/extend/selectors#known-issues
        selector:
          "ImportDeclaration[importKind!='type'][source.value=/editorComponents\\u002FCodeEditor(\\u002Findex)?$/]",
        message:
          "Please don’t import CodeEditor directly – this will cause it to be bundled in the main chunk. Instead, use the LazyCodeEditor component.",
      },
    ],
  },
  settings: {
    "import/resolver": {
      "babel-module": {},
    },
    react: {
      pragma: "React",
      // Tells eslint-plugin-react to automatically detect the version of React to use
      version: "detect",
    },
  },
  env: {
    browser: true,
    node: true,
    "cypress/globals": true,
    worker: true,
  },
};

eslintConfig.overrides = [
  // For CodeEditor, disable CodeEditor- and CodeMirror-specific import rules
  {
    files: ["**/components/editorComponents/CodeEditor/**/*"],
    rules: {
      "@typescript-eslint/no-restricted-imports":
        getRestrictedImportsOverrideForCodeEditor(),
      "no-restricted-syntax": getRestrictedSyntaxOverrideForCodeEditor(),
    },
  },
];

function getRestrictedImportsOverrideForCodeEditor() {
  const [errorLevel, existingRules] =
    eslintConfig.rules["@typescript-eslint/no-restricted-imports"];

  const newPatterns = (existingRules.patterns ?? []).filter(
    (i) => i.group[0] !== "**/components/editorComponents/CodeEditor",
  );
  const newPaths = (existingRules.paths ?? []).filter(
    (i) => i.name !== "codemirror",
  );

  if (newPatterns.length === 0 && newPaths.length === 0) {
    return ["off"];
  }

  return [errorLevel, { patterns: newPatterns, paths: newPaths }];
}

function getRestrictedSyntaxOverrideForCodeEditor() {
  const [errorLevel, ...existingRules] =
    eslintConfig.rules["no-restricted-syntax"];

  const newRules = existingRules.filter(
    (i) =>
      i.selector !==
      "ImportDeclaration[source.value=/editorComponents\\u002FCodeEditor(\\u002Findex)?$/]",
  );

  if (newRules.length === 0) {
    return ["off"];
  }

  return [errorLevel, ...newRules];
}

module.exports = eslintConfig;

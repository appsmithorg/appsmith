// The `@type` comment improves auto-completion for VS Code users: https://github.com/appsmithorg/appsmith/pull/21602#discussion_r1144528505
/** @type {import('eslint').Linter.Config} */
const fs = require("fs");
const path = require("path");
const JSON5 = require("json5");

const baseEslintConfig = JSON5.parse(
  fs.readFileSync(path.join(__dirname, "./.eslintrc.base.json"), "utf8"),
);
const baseNoRestrictedImports =
  baseEslintConfig.rules["@typescript-eslint/no-restricted-imports"][1];

const eslintConfig = {
  extends: ["./.eslintrc.base.json"],
  rules: {
    "testing-library/no-container": "off",
    "testing-library/no-node-access": "off",
    "testing-library/no-debugging-utils": "off",
    "testing-library/prefer-screen-queries": "off",
    "testing-library/render-result-naming-convention": "off",
    "testing-library/no-unnecessary-act": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    // `no-restricted-imports` is disabled, as recommended in https://typescript-eslint.io/rules/no-restricted-imports/.
    // Please use @typescript-eslint/no-restricted-imports below instead.
    "no-restricted-imports": "off",
    "@typescript-eslint/no-restricted-imports": [
      "error",
      {
        paths: [
          ...(baseNoRestrictedImports.paths ?? []),
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
          {
            name: "sql-formatter",
            importNames: ["format"],
            message:
              "Reason: Instead of `import { format }` (which bundles all formatting dialects), please import only dialects you need (e.g. `import { formatDialect, postgresql }`. See https://github.com/sql-formatter-org/sql-formatter/issues/452",
          },
        ],
        patterns: [
          ...(baseNoRestrictedImports.patterns ?? []),
          {
            group: ["**/ce/*"],
            message: "Reason: Please use ee/ import instead.",
          },
        ],
      },
    ],
    "no-restricted-syntax": [
      // Annoyingly, the `no-restricted-imports` rule doesn’t allow to restrict imports of
      // `editorComponents/CodeEditor` but not `editorComponents/CodeEditor/*`: https://stackoverflow.com/q/64995811/1192426
      // So we’re using `no-restricted-syntax` instead.
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
      // Annoyingly, no-restricted-imports follows the gitignore exclude syntax,
      // so there’s no way to exclude all @uppy/* but not @uppy/*/*.css imports:
      // https://github.com/eslint/eslint/issues/16927
      {
        // Match all
        //   - `import` statements
        //   - that are not `import type` statements – we allow type imports as they don’t lead to bundling the dependency
        //   - that import `@uppy/*` unless the `*` part ends with `.css`
        // Note: using `\\u002F` instead of `/` due to https://eslint.org/docs/latest/extend/selectors#known-issues
        selector:
          "ImportDeclaration[importKind!='type'][source.value=/^@uppy\\u002F(?!.*.css$)/]",
        message:
          "Please don’t import Uppy directly. End users rarely use Uppy (e.g. only when they need to upload a file) – but Uppy bundles ~200 kB of JS. Please import it lazily instead.",
      },
    ],
  },
};

eslintConfig.overrides = [
  // For CodeEditor, disable CodeEditor- and CodeMirror-specific import rules
  {
    files: ["**/components/editorComponents/CodeEditor/**/*"],
    rules: {
      "@typescript-eslint/no-restricted-imports":
        getRestrictedImportsOverrideForCodeEditor(eslintConfig),
      "no-restricted-syntax":
        getRestrictedSyntaxOverrideForCodeEditor(eslintConfig),
    },
  },
  {
    files: ["**/ee/**/*"],
    rules: {
      ...eslintConfig.rules,
      "@typescript-eslint/no-restricted-imports":
        getRestrictedImportsOverrideForEE(eslintConfig),
    },
  },
];

function getRestrictedImportsOverrideForCodeEditor(eslintConfig) {
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

function getRestrictedSyntaxOverrideForCodeEditor(eslintConfig) {
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

function getRestrictedImportsOverrideForEE(eslintConfig) {
  const [errorLevel, existingRules] =
    eslintConfig.rules["@typescript-eslint/no-restricted-imports"];

  const newPatterns = (existingRules.patterns ?? []).filter(
    (i) => i.group[0] !== "**/ce/*",
  );

  if (newPatterns.length === 0) {
    return ["off"];
  }

  return [errorLevel, { paths: existingRules.paths, patterns: newPatterns }];
}

module.exports = eslintConfig;

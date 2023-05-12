// The `@type` comment improves auto-completion for VS Code users: https://github.com/appsmithorg/appsmith/pull/21602#discussion_r1144528505
/** @type {import('eslint').Linter.Config} */
const eslintConfig = {
  extends: ["../.eslintrc.base.json"],
  rules: {
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
        patterns: [
          {
            group: ["@blueprintjs/core/lib/esnext/*"],
            message:
              "Reason: @blueprintjs/core has both lib/esnext and lib/esm directories which export the same components. To avoid duplicating components in the bundle, please import only from the lib/esm directory.",
          },
          {
            group: ["*.svg"],
            importNames: ["ReactComponent"],
            message:
              "Reason: Please don’t import SVG icons statically. (They won’t always be needed, but they *will* always be present in the bundle and will increase the bundle size.) Instead, please either import them as SVG paths (e.g. import starIconUrl from './star.svg'), or use the importSvg wrapper from design-system-old (e.g. const StarIcon = importSvg(() => import('./star.svg'))).",
          },
          {
            group: ["remixicon-react/*"],
            message:
              "Reason: Please don’t import Remix icons statically. (They won’t always be needed, but they *will* always be present in the bundle and will increase the bundle size.) Instead, please use the importRemixIcon wrapper from design-system-old (e.g. const StarIcon = importRemixIcon(() => import('remixicon-react/Star'))).",
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

module.exports = eslintConfig;

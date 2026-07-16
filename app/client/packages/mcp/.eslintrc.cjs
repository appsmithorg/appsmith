// This package is excluded from the client root tsconfig (it has its own tsc, like rts), so type-aware lint rules
// need the package tsconfig. tsconfigRootDir pins resolution to this directory regardless of eslint's cwd — the
// pre-commit hook lints from app/client while `yarn g:lint` lints from the package, and both must resolve the same
// project. (.cjs because the package is "type": "module" and eslint rc configs must be CommonJS.)
module.exports = {
  extends: ["../../.eslintrc.base.json"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
  ignorePatterns: ["dist"],
  // Same relaxations as packages/rts and app/client's own .eslintrc.js: these strict rules are not enforced
  // anywhere else in the repo, and this package predates the config. The testing-library naming rule also
  // misfires here — these tests exercise an HTTP server, not a DOM render.
  rules: {
    "@typescript-eslint/prefer-nullish-coalescing": "off",
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "testing-library/no-debugging-utils": "off",
    "testing-library/render-result-naming-convention": "off",
  },
};

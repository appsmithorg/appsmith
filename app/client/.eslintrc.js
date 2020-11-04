module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint", "prettier", "react-hooks"],
  extends: [
    "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
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
    "react-hooks/rules-of-hooks": "error",
    "@typescript-eslint/no-use-before-define": 0,
    "@typescript-eslint/no-var-requires": 0,
    "import/no-webpack-loader-syntax": 0,
    "no-undef": 0,
    "react/prop-types": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
  },
  settings: {
    react: {
      pragma: "React",
      version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  env: {
    browser: true,
    node: true,
  },
};

import { rule as objectKeysRule } from "./object-keys/rule";

module.exports = {
  rules: {
    "object-keys": objectKeysRule,
  },
  configs: {
    recommended: {
      rules: {
        "@appsmith/object-keys": "warn",
      },
    },
  },
};

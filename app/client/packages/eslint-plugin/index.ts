import { rule as objectKeysRule } from "./object-keys/rule";

export default {
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

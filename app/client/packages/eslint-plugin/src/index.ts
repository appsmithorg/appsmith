import { objectKeysRule } from "./object-keys/rule";

const plugin = {
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

module.exports = plugin;

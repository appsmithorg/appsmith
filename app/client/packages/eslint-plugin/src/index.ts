import { objectKeysRule } from "./object-keys/rule";
import { namedUseEffectRule } from "./named-use-effect/rule";

const plugin = {
  rules: {
    "object-keys": objectKeysRule,
    "named-use-effect": namedUseEffectRule,
  },
  configs: {
    recommended: {
      rules: {
        "@appsmith/object-keys": "warn",
        "@appsmith/named-use-effect": "warn",
      },
    },
  },
};

module.exports = plugin;

import { objectKeysRule } from "./object-keys/rule";
import { namedUseEffectRule } from "./named-use-effect/rule";
import { consistentStorybookTitle } from "./consistent-storybook-title/rule";

const plugin = {
  rules: {
    "object-keys": objectKeysRule,
    "named-use-effect": namedUseEffectRule,
    "consistent-storybook-title": consistentStorybookTitle,
  },
  configs: {
    recommended: {
      rules: {
        "@appsmith/object-keys": "warn",
        "@appsmith/named-use-effect": "warn",
        "@appsmith/consistent-storybook-title": "error",
      },
    },
  },
};

module.exports = plugin;

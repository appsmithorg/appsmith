/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { rule: objectKeysRule } = require("./object-keys/rule");

module.exports = {
  rules: {
    "object-keys": objectKeysRule,
  },
};

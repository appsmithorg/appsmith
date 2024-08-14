/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { rule } = require("./object-keys-replacement/rule");

module.exports = {
  rules: {
    "object-keys": rule,
  },
};

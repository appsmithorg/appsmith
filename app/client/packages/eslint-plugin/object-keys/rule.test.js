/* eslint-disable @typescript-eslint/no-var-requires */
const { RuleTester } = require("eslint");
const objectKeysRule = require("./rule");
/* eslint-enable @typescript-eslint/no-var-requires */

const ruleTester = new RuleTester({});

ruleTester.run("object-keys", objectKeysRule.rule, {
  valid: [
    {
      code: "objectKeys({ 'a': 'b' })",
    },
  ],
  invalid: [
    {
      code: "Object.keys({ 'a': 'b' })",
      errors: [{ messageId: "useObjectKeys" }],
    },
  ],
});

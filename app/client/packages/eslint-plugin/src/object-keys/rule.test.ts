import { TSESLint } from "@typescript-eslint/utils";
import { objectKeysRule } from "./rule";

const ruleTester = new TSESLint.RuleTester();

ruleTester.run("object-keys", objectKeysRule, {
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

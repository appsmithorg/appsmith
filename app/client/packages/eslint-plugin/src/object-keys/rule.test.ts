import { TSESLint } from "@typescript-eslint/utils";
import { rule } from "./rule";

const ruleTester = new TSESLint.RuleTester();

ruleTester.run("object-keys", rule, {
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

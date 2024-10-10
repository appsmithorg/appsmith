import { TSESLint } from "@typescript-eslint/utils";
import { namedUseEffectRule } from "./rule";

const ruleTester = new TSESLint.RuleTester();

ruleTester.run("named-use-effect", namedUseEffectRule, {
  valid: [
    {
      code: "useEffect(function add(){ }, [])",
    },
    {
      code: "React.useEffect(function add(){ }, [])",
    },
  ],
  invalid: [
    {
      code: "useEffect(function (){ }, [])",
      errors: [{ messageId: "useNamedUseEffect" }],
    },
    {
      code: "React.useEffect(function (){ }, [])",
      errors: [{ messageId: "useNamedUseEffect" }],
    },
  ],
});

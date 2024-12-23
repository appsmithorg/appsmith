import { TSESLint } from "@typescript-eslint/utils";
import { consistentStorybookTitle } from "./rule";

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

ruleTester.run("storybook-title-case", consistentStorybookTitle, {
  valid: [
    {
      code: `export default { title: "ADS/Templates/IDE Header" };`,
      filename: "example.stories.tsx",
    },
    {
      code: `export default { title: "ADS/Components/Input/IDE Search Input" };`,
      filename: "example.stories.tsx",
    },
    {
      code: `export default { title: "ADS/Components/Input/AAA Number Input" };`,
      filename: "example.stories.tsx",
    },
    {
      code: `const meta = { title: "WDS/Widgets/Button" };`,
      filename: "example.stories.tsx",
    },
  ],
  invalid: [
    {
      code: `export default { title: "ADS/Templates/IDEHeader" };`,
      filename: "example.stories.tsx",
      errors: [
        {
          messageId: "invalidTitle",
          data: {
            title: "ADS/Templates/IDEHeader",
            suggestedTitle: "ADS/Templates/IDE Header",
          },
        },
      ],
      output: `export default { title: "ADS/Templates/IDE Header" };`,
    },
    {
      code: `export default { title: "ADS/Components/Input/IDESearch Input" };`,
      filename: "example.stories.tsx",
      errors: [
        {
          messageId: "invalidTitle",
          data: {
            title: "ADS/Components/Input/IDESearch Input",
            suggestedTitle: "ADS/Components/Input/IDE Search Input",
          },
        },
      ],
      output: `export default { title: "ADS/Components/Input/IDE Search Input" };`,
    },
    {
      code: `export default { title: "ADS/Components/Input/IDESearchInput" };`,
      filename: "example.stories.tsx",
      errors: [
        {
          messageId: "invalidTitle",
          data: {
            title: "ADS/Components/Input/IDESearchInput",
            suggestedTitle: "ADS/Components/Input/IDE Search Input",
          },
        },
      ],
      output: `export default { title: "ADS/Components/Input/IDE Search Input" };`,
    },
    {
      code: `export default { title: "ADS/Components/Input/AAANumber Input" };`,
      filename: "example.stories.tsx",
      errors: [
        {
          messageId: "invalidTitle",
          data: {
            title: "ADS/Components/Input/AAANumber Input",
            suggestedTitle: "ADS/Components/Input/AAA Number Input",
          },
        },
      ],
      output: `export default { title: "ADS/Components/Input/AAA Number Input" };`,
    },
    {
      code: `export default { title: "WDS/Widgets/button" };`,
      filename: "example.stories.tsx",
      errors: [
        {
          messageId: "invalidTitle",
          data: {
            title: "WDS/Widgets/button",
            suggestedTitle: "WDS/Widgets/Button",
          },
        },
      ],
      output: `export default { title: "WDS/Widgets/Button" };`,
    },
  ],
});

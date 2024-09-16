# Adding a Custom Rule to Your Appsmith ESLint Plugin

Welcome to the guide for adding a custom rule to your Appsmith ESLint plugin. Follow these steps to create and integrate a new rule into your Appsmith ESLint plugin.

You can create one by following the [official ESLint custom rule](https://eslint.org/docs/latest/extend/custom-rule-tutorial).

## Step 1: Create the Custom Rule File

1. Navigate to your Appsmith ESLint plugin directory i.e. `app/client/packages/eslint-plugin`.
2. Create a new directory for your custom rule in the root of `app/client/packages/eslint-plugin` directory. For example, `src/custom-rule/rule.ts`.

   ```bash
   mkdir src/custom-rule
   touch src/custom-rule/rule.ts
   touch src/custom-rule/rule.test.ts
   ```

3. Open `src/custom-rule/rule.ts` and define your rule. Here's a basic template to get you started:

   ```ts
   import type { TSESLint } from "@typescript-eslint/utils";

   export const customRule: TSESLint.RuleModule<"useObjectKeys"> = {
     defaultOptions: [],
     meta: {
       type: "problem", // or "suggestion" or "layout"
       docs: {
         description: "A description of what the rule does",
         category: "Best Practices",
         recommended: false,
       },
       fixable: null, // or "code" if the rule can fix issues automatically
       schema: [], // JSON Schema for rule options
     },
     create(context) {
       return {
         // Define the rule's behavior here
         // e.g., "Identifier": (node) => { /* logic */ }
       };
     },
   };
   ```

## Step 2: Update the Plugin Index File

1. Open the `src/index.ts` file inside `eslint-plugin` directory.

2. Import your custom rule and add it to the rules object in `index.ts`. For example:

   ```ts
   import { customRule } from "./custom-rule/rule";

   const plugin = {
     rules: {
       "custom-rule": customRule,
     },
     configs: {
       recommended: {
         rules: {
           "@appsmith/custom-rule": "warn", // Add this in recommended if you want to add this rule by default to the repository as a recommended rule.
         },
       },
     },
   };

   module.exports = plugin;
   ```

## Step 3: Add Tests for Your Custom Rule

1. Open `src/custom-rule/rule.test.ts` and write tests using a testing framework like Jest. Here's a basic example using ESLint's `RuleTester`:

   ```ts
   import { TSESLint } from "@typescript-eslint/utils";
   import { customRule } from "./rule";

   const ruleTester = new TSESLint.RuleTester();

   ruleTester.run("custom-rule", customRule, {
     valid: [
       // Examples of valid code
     ],
     invalid: [
       {
         code: "const foo = 1;",
         errors: [{ message: "Your custom error message" }],
       },
     ],
   });
   ```

2. Run your tests to ensure your rule works as expected:

   ```bash
   yarn run test:unit
   ```

## Step 4: Steps to add it to client

1. Go to `app/client/.eslintrc.base.json`
2. Add your `custom-rule` entry to the rules object or if the recommended rule is present its already added in the config. e.g.

   ```javascript
    "@appsmith/custom-rule": "warn"
   ```

## Additional Resources

- [ESLint Plugin Developer Guide](https://eslint.org/docs/developer-guide/working-with-plugins)
- [ESLint Rules API](https://eslint.org/docs/developer-guide/working-with-rules)
- [ESLint Testing Guidelines](https://eslint.org/docs/developer-guide/unit-testing)

Happy linting!

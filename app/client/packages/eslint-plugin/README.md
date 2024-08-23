# Adding a Custom Rule to Your Appsmith ESLint Plugin

Welcome to the guide for adding a custom rule to your Appsmith ESLint plugin. Follow these steps to create and integrate a new rule into your Appsmith ESLint plugin.

You can create one by following the [official ESLint custom rule](https://eslint.org/docs/latest/extend/custom-rule-tutorial).

## Step 1: Create the Custom Rule File

1. Navigate to your Appsmith ESLint plugin directory i.e. `app/client/packages/eslint-plugin`.
2. Create a new directory for your custom rule in the root of `app/client/packages/eslint-plugin` directory. For example, `custom-rule/rule.js`.

   ```bash
   mkdir custom-rule
   touch custom-rule/rule.js
   ```

3. Open `custom-rule/rule.js` and define your rule. Here's a basic template to get you started:

   ```js
   module.exports = {
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

1. Open the `index.js` file inside `eslint-plugin` directory.

2. Import your custom rule and add it to the rules object in `index.js`. For example:

   ```js
   const customRule = require("./custom-rule/rule.js");

   module.exports = {
     rules: {
       "custom-rule": customRule,
     },
   };
   ```

## Step 3: Add Tests for Your Custom Rule

1. Create a test file for your rule in the `custom-rule` directory. For example, `custom-rule/rule.test.js`.

   ```bash
   touch custom-rule/rule.test.js
   ```

2. Open `custom-rule/rule.test.js` and write tests using a testing framework like Mocha or Jest. Here's a basic example using ESLint's `RuleTester`:

   ```js
   const rule = require("./rule");
   const RuleTester = require("eslint").RuleTester;

   const ruleTester = new RuleTester();

   ruleTester.run("custom-rule", rule, {
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

3. Run your tests to ensure your rule works as expected:

   ```bash
   yarn run test:unit
   ```

## Step 4: Steps to add it to client

1. Go to `app/client/.eslintrc.base.json`
2. Add your `custom-rule` entry to the rules object. e.g.

   ```javascript
    "custom-rule": "warn"
   ```

## Additional Resources

- [ESLint Plugin Developer Guide](https://eslint.org/docs/developer-guide/working-with-plugins)
- [ESLint Rules API](https://eslint.org/docs/developer-guide/working-with-rules)
- [ESLint Testing Guidelines](https://eslint.org/docs/developer-guide/unit-testing)

Happy linting!

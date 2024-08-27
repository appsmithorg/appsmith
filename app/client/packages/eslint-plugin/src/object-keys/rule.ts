import type { TSESLint } from "@typescript-eslint/utils";

export const objectKeysRule: TSESLint.RuleModule<"useObjectKeys"> = {
  defaultOptions: [],
  meta: {
    type: "suggestion",
    docs: {
      description: "Warns when Object.keys is used instead of objectKeys",
      recommended: "warn",
    },
    schema: [], // No options
    messages: {
      useObjectKeys:
        "Use objectKeys from '@appsmith/utils' package instead of Object.keys",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if the callee is Object.keys
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "Object" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "keys"
        ) {
          context.report({
            node,
            messageId: "useObjectKeys",
          });
        }
      },
    };
  },
};

import type { TSESLint } from "@typescript-eslint/utils";

export const namedUseEffectRule: TSESLint.RuleModule<"useNamedUseEffect"> = {
  defaultOptions: [],
  meta: {
    type: "suggestion",
    docs: {
      description: "Warns when useEffect hook has an anonymous function",
      recommended: "warn",
    },
    schema: [], // No options
    messages: {
      useNamedUseEffect:
        "The function inside the useEffect should be named for better readability",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if the useEffect has a named function
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "useEffect"
        ) {
          const firstArg = node.arguments[0];

          if (firstArg.type === "ArrowFunctionExpression") {
            context.report({
              node,
              messageId: "useNamedUseEffect",
            });
          }

          if (firstArg.type === "FunctionExpression") {
            if (!firstArg.id) {
              context.report({
                node,
                messageId: "useNamedUseEffect",
              });
            }
          }
        }
      },
    };
  },
};

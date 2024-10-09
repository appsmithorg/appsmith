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
        "The function inside the useEffect should be named for better readability eg: useEffect(function mySideEffect() {...}, [])",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        // useEffect used directly
        // eg
        // import { useEffect } from "react";
        // ...
        // useEffect(() => {}, [])
        const isDirectCall =
          node.callee.type === "Identifier" && node.callee.name === "useEffect";

        // useEffect used via React object
        // eg
        // import React from "react";
        // ...
        // React.useEffect(() => {}, [])
        const isMemberExpressionCall =
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "React" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "useEffect";

        if (isDirectCall || isMemberExpressionCall) {
          // Get the first argument which should be a function
          const callbackArg = node.arguments[0];

          // Arrow function are never named so it is discouraged
          if (callbackArg.type === "ArrowFunctionExpression") {
            context.report({
              node: callbackArg,
              messageId: "useNamedUseEffect",
            });
          }

          // Function Expressions can be unnamed. This is also discouraged
          if (callbackArg.type === "FunctionExpression") {
            if (!callbackArg.id) {
              context.report({
                node: callbackArg,
                messageId: "useNamedUseEffect",
              });
            }
          }
        }
      },
    };
  },
};

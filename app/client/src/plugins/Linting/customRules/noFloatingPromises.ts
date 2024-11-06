/* eslint-disable @typescript-eslint/no-explicit-any */
export const noFloatingPromisesLintRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Requires handling of Promises (using await or .then())",
      category: "Possible Errors",
      recommended: false,
    },
    messages: {
      unhandledPromise: "Unhandled Promise detected.",
    },
    schema: [], // No options for now
  },
  create: function (context: any) {
    return {
      ExpressionStatement(node: any) {
        // Check if the expression returns a Promise
        if (isPromiseReturningExpression(node.expression)) {
          // Check if the expression is properly handled
          if (!isHandledPromise(node.expression)) {
            context.report({
              node: node.expression,
              messageId: "unhandledPromise",
            });
          }
        }
      },
      // Additional node visitors can be added if needed
    };

    // Helper function to determine if an expression returns a Promise
    function isPromiseReturningExpression(expression: any) {
      if (
        expression.type === "NewExpression" &&
        expression.callee.name === "Promise"
      ) {
        return true;
      }
    }

    // Helper function to determine if a Promise is handled
    function isHandledPromise(expression: any) {
      // Implement logic to check if the Promise is awaited or chained
      // This may involve checking parent nodes or usage patterns
      return expression; // Placeholder logic
    }
  },
};

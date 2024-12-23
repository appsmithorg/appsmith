import type { Rule } from "eslint";
import type * as ESTree from "estree";

export const noFloatingPromisesLintRule: Rule.RuleModule = {
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
  create: function (context: Rule.RuleContext) {
    return {
      FunctionDeclaration(node: ESTree.FunctionDeclaration) {
        traverseNode(node.body, null);
      },
    };

    function traverseNode(
      node: ESTree.Node | null,
      parent: ESTree.Node | null,
    ) {
      if (!node) return;

      // Check for CallExpression
      if (node.type === "CallExpression") {
        checkCallExpression(node as ESTree.CallExpression, parent);
      }

      // Traverse child nodes
      const visitorKeys = context.getSourceCode().visitorKeys[node.type] || [];

      for (const key of visitorKeys) {
        const child = (node as any)[key]; // eslint-disable-line @typescript-eslint/no-explicit-any

        if (Array.isArray(child)) {
          child.forEach(
            (c) => c && typeof c.type === "string" && traverseNode(c, node),
          );
        } else if (child && typeof child.type === "string") {
          traverseNode(child, node);
        }
      }
    }

    function isInAsyncFunction(node: ESTree.Node | null): boolean {
      while (node) {
        if (
          (node.type === "FunctionDeclaration" ||
            node.type === "FunctionExpression") &&
          node.async
        ) {
          return true;
        }

        // @ts-expect-error: Types are not available
        node = node.parent;
      }

      return false;
    }

    function checkCallExpression(
      node: ESTree.CallExpression,
      parent: ESTree.Node | null,
    ) {
      const callee = node.callee;
      let isPotentialAsyncCall = false;

      if (callee.type === "MemberExpression") {
        const property = callee.property;

        if (property.type === "Identifier" && property.name === "run") {
          isPotentialAsyncCall = true;
        }
      }

      if (isPotentialAsyncCall && isInAsyncFunction(parent)) {
        if (
          parent &&
          parent.type !== "AwaitExpression" &&
          parent.type !== "ReturnStatement" &&
          !isHandledWithPromiseMethods(parent)
        ) {
          context.report({
            node,
            messageId: "unhandledPromise",
          });
        }
      }
    }

    function isHandledWithPromiseMethods(parent: ESTree.Node): boolean {
      if (
        parent.type === "MemberExpression" &&
        parent.property &&
        ["then", "catch", "finally"].includes(
          (parent.property as ESTree.Identifier).name,
        )
      ) {
        return true;
      }

      return false;
    }
  },
};

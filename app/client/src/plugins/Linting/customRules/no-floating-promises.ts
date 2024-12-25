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
      unhandledPromise:
        "Unhandled Promise detected. Handle using await or .then()",
    },
    schema: [], // Rule does not accept configuration options
  },
  create: function (context: Rule.RuleContext) {
    // Access async functions from settings
    const asyncFunctions = context.settings?.asyncFunctions || [];

    return {
      FunctionDeclaration(node: ESTree.FunctionDeclaration) {
        // Start traversal from the function body
        traverseNode(node.body, null);
      },
    };

    /**
     * Recursively traverses the AST node and its children.
     * Processes CallExpressions and continues traversing child nodes.
     */
    function traverseNode(
      node: ESTree.Node | null,
      parent: ESTree.Node | null,
    ) {
      if (!node) return;

      if (node.type === "CallExpression") {
        checkCallExpression(node as ESTree.CallExpression, parent);
      }

      // Retrieve keys for child nodes and traverse them
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

    /**
     * Determines if a node is inside an async function by traversing its parent chain.
     */
    function isInAsyncFunction(node: ESTree.Node | null): boolean {
      while (node) {
        if (
          (node.type === "FunctionDeclaration" ||
            node.type === "FunctionExpression") &&
          node.async
        ) {
          return true;
        }

        // Move to the parent node in the AST
        // @ts-expect-error: Types may not always define `parent`
        node = node.parent;
      }

      return false;
    }

    /**
     * Checks if a CallExpression represents an unhandled Promise.
     * Reports an error if the promise is not awaited or chained with `.then()`, `.catch()`, or `.finally()`.
     */
    function checkCallExpression(
      node: ESTree.CallExpression,
      parent: ESTree.Node | null,
    ) {
      const callee = node.callee;
      let isPotentialAsyncCall = false;

      // Identify async calls by matching against the asyncFunctions list
      if (callee.type === "MemberExpression") {
        const object = callee.object;
        const property = callee.property;

        if (
          property.type === "Identifier" &&
          object.type === "Identifier" &&
          asyncFunctions.includes(`${object.name}.${property.name}`)
        ) {
          isPotentialAsyncCall = true;
        }
      }

      // Report if the async call is unhandled and not properly awaited
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

    /**
     * Determines if a CallExpression is handled with `.then()`, `.catch()`, or `.finally()`.
     */
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

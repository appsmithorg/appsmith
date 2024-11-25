import { objectKeys } from "@appsmith/utils";
import type { Rule } from "eslint";
import type * as ESTree from "estree";

function isIdentifier(
  node: ESTree.Node | null | undefined,
): node is ESTree.Identifier {
  return node?.type === "Identifier";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const eslintGlobals = context.settings?.eslintGlobals || {};

    // eslint-disable-next-line @appsmith/object-keys
    const asyncFunctionNames: string[] = Object.keys(eslintGlobals).filter(
      (name) => {
        // Assuming functions marked as async have a specific property
        return eslintGlobals[name] === true; // Adjust based on your implementation
      },
    );

    return {
      // Entry point: FunctionDeclaration (for $$closedFn)
      FunctionDeclaration(node: ESTree.FunctionDeclaration) {
        traverseNode(node.body, null);
      },
    };

    function traverseNode(
      node: ESTree.Node | null,
      parent: ESTree.Node | null,
    ) {
      if (!node) return;

      // Check if the node is a VariableDeclaration
      if (node.type === "VariableDeclaration") {
        // Process variable declarations
        for (const declarator of node.declarations) {
          if (
            declarator.id.type === "Identifier" &&
            declarator.id.name === "$$result" &&
            declarator.init &&
            declarator.init.type === "ObjectExpression"
          ) {
            // Found the ObjectExpression assigned to $$result
            traverseObjectExpression(declarator.init);
          }
        }
      }

      // Check for CallExpression
      if (node.type === "CallExpression") {
        checkCallExpression(node as ESTree.CallExpression, parent);
      }

      const visitorKeys = context.getSourceCode().visitorKeys;
      const keys =
        visitorKeys[node.type] ||
        objectKeys(node).filter((key) => typeof node[key] === "object");

      for (const key of keys) {
        const child = (node as any)[key];

        if (Array.isArray(child)) {
          for (const c of child) {
            if (c && typeof c.type === "string") {
              traverseNode(c as ESTree.Node, node);
            }
          }
        } else if (child && typeof child.type === "string") {
          traverseNode(child as ESTree.Node, node);
        }
      }
    }

    function traverseObjectExpression(node: ESTree.ObjectExpression) {
      for (const property of node.properties) {
        if (property.type === "Property") {
          const value = property.value;

          if (
            (value.type === "FunctionExpression" ||
              value.type === "ArrowFunctionExpression") &&
            value.async
          ) {
            // Found an async function within the object
            traverseNode(value.body, null);
          }
        }
      }
    }

    function checkCallExpression(
      node: ESTree.CallExpression,
      parent: ESTree.Node | null,
    ) {
      const callee = node.callee;

      let isPotentialAsyncCall = false;
      let objectName = "";
      let propertyName = "";

      if (callee.type === "MemberExpression") {
        const memberExpr = callee;
        const object = memberExpr.object;
        const property = memberExpr.property;

        if (property.type === "Identifier") {
          propertyName = property.name;
        } else if (property.type === "Literal") {
          propertyName = String(property.value);
        }

        if (object.type === "ThisExpression") {
          objectName = "this";

          if (asyncFunctionNames.includes(propertyName)) {
            isPotentialAsyncCall = true;
          }
        } else if (object.type === "Identifier") {
          objectName = object.name;

          if (propertyName === "run") {
            isPotentialAsyncCall = true;
          }
        }
      } else if (callee.type === "Identifier") {
        if (asyncFunctionNames.includes(callee.name)) {
          isPotentialAsyncCall = true;
        }
      }

      if (isPotentialAsyncCall) {
        if (
          parent &&
          parent.type !== "AwaitExpression" &&
          parent.type !== "ReturnStatement"
        ) {
          if (
            parent.type === "MemberExpression" &&
            (parent as ESTree.MemberExpression).property
          ) {
            const memberExpr = parent as ESTree.MemberExpression;
            const property = memberExpr.property;

            if (isIdentifier(property)) {
              if (["then", "catch", "finally"].includes(property.name)) {
                // The promise is being handled with .then(), .catch(), or .finally()
                return;
              }
            }
          }

          // Report error
          context.report({
            node,
            messageId: "unhandledPromise",
            data: {
              functionName:
                callee.type === "Identifier"
                  ? callee.name
                  : `${objectName}.${propertyName}`,
            },
          });
        }
      }
    }
  },
};

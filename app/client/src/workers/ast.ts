/* eslint-disable @typescript-eslint/ban-ts-comment */
import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import { isNumber } from "lodash";

export const getAST = (code: string) => parse(code, { ecmaVersion: 2020 });

export const getAllIdentifiers = (code: string): string[] => {
  const identifiers = new Set<string>();
  const variableDeclarations = new Set<string>();
  const functionalParams = new Set<string>();
  const ast = getAST(code);
  ancestor(ast, {
    Identifier(node: Node, ancestors: Node[]) {
      const currentCode = code;
      let memberExpressionNode = node;
      let depth = ancestors.length - 1;
      while (depth > 0) {
        const parent = ancestors[depth - 1];
        if (
          // @ts-ignore
          parent.type === "MemberExpression" &&
          // @ts-ignore
          !parent.computed &&
          // @ts-ignore
          !parent.optional
        ) {
          memberExpressionNode = parent;
          depth = depth - 1;
        } else {
          break;
        }
      }
      if (memberExpressionNode.type === "Identifier") {
        // @ts-ignore
        identifiers.add(memberExpressionNode.name);
      } else {
        const nestedIdentifier = constructFinalMemberExpIdentifier(
          memberExpressionNode,
        );
        identifiers.add(nestedIdentifier);
      }
    },
    VariableDeclarator(node: Node) {
      // @ts-ignore
      variableDeclarations.add(node.id.name);
    },
    FunctionDeclaration(node: Node) {
      // @ts-ignore
      node.params.forEach((paramNode) => {
        if (paramNode.type === "Identifier") {
          functionalParams.add(paramNode.name);
        } else if (paramNode.type === "AssignmentPattern") {
          functionalParams.add(paramNode.left.name);
        }
      });
    },
  });
  variableDeclarations.forEach((variable) => identifiers.delete(variable));
  functionalParams.forEach((param) => identifiers.delete(param));
  return Array.from(identifiers);
};

const constructFinalMemberExpIdentifier = (node: Node, child = ""): string => {
  // @ts-ignore
  if (node.object.type === "Identifier") {
    const propertyName = getPropertyName(node);
    // @ts-ignore
    return `${node.object.name}.${propertyName}${child ? "." + child : ""}`;
  } else {
    const propertyName = getPropertyName(node);
    // @ts-ignore
    const nestedChild = `${propertyName}${child ? "." + child : ""}`;
    // @ts-ignore
    return constructFinalMemberExpIdentifier(node.object, nestedChild);
  }
};

const getPropertyName = (node: Node) => {
  // @ts-ignore
  let propertyName = node.property.name;
  // @ts-ignore
  if (node.property.type === "Literal") {
    // @ts-ignore
    if (isNumber(node.property.value)) {
      propertyName = "";
    } else {
      // @ts-ignore
      propertyName = node.property.value;
    }
  }
  return propertyName;
};

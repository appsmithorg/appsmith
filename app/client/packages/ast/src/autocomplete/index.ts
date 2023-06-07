import { getAST, isIdentifierNode, isMemberExpressionNode } from "../index";
import { simple } from "acorn-walk";
import type { Node } from "acorn";

export const isBracketOrDotNotation = (value: string): boolean | null => {
  let ast: Node = { end: 0, start: 0, type: "" };
  let isObj = false;
  try {
    ast = getAST(value);
  } catch (e) {
    return null;
  }

  simple(ast, {
    MemberExpression(node) {
      if (isMemberExpressionNode(node)) {
        isObj = true;
      }
    },
  });
  return isObj;
};

export const isIdentifier = (value: string): boolean | null => {
  let ast: Node = { end: 0, start: 0, type: "" };
  let isIdentifier = false;
  try {
    ast = getAST(value);
  } catch (e) {
    return null;
  }

  simple(ast, {
    Identifier(node) {
      if (isIdentifierNode(node)) {
        isIdentifier = true;
      }
    },
  });
  return isIdentifier;
};

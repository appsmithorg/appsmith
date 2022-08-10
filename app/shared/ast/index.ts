import {
  ObjectExpression,
  PropertyNode,
  isIdentifierNode,
  isVariableDeclarator,
  isObjectExpression,
  isLiteralNode,
  isPropertyNode,
  isPropertyAFunctionNode,
  getAST,
  extractIdentifiersFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
} from "./src/index";

// JSObjects
import { parseJSObjectWithAST } from "./src/jsObject";

export type { ObjectExpression, PropertyNode };

export {
  isIdentifierNode,
  isVariableDeclarator,
  isObjectExpression,
  isLiteralNode,
  isPropertyNode,
  isPropertyAFunctionNode,
  getAST,
  extractIdentifiersFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObjectWithAST,
};

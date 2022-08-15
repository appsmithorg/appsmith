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

// constants
import { ECMA_VERSION, SourceType, NodeTypes } from "./src/constants";

// JSObjects
import { parseJSObjectWithAST } from "./src/jsObject";

// types or intefaces should be exported with type keyword, while enums can be exported like normal functions
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
  ECMA_VERSION,
  SourceType,
  NodeTypes,
};

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
  extractIdentifierInfoFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  MemberExpressionData,
  IdentifierInfo,
} from "./src";

// constants
import { ECMA_VERSION, SourceType, NodeTypes } from "./src/constants";

// JSObjects
import { parseJSObjectWithAST } from "./src/jsObject";

// types or intefaces should be exported with type keyword, while enums can be exported like normal functions
export type {
  ObjectExpression,
  PropertyNode,
  MemberExpressionData,
  IdentifierInfo,
};

export {
  isIdentifierNode,
  isVariableDeclarator,
  isObjectExpression,
  isLiteralNode,
  isPropertyNode,
  isPropertyAFunctionNode,
  getAST,
  extractIdentifierInfoFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObjectWithAST,
  ECMA_VERSION,
  SourceType,
  NodeTypes,
};

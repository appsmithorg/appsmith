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
  extractInfoFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  MemberExpressionData,
  ExtractInfoFromCode,
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
  ExtractInfoFromCode,
};

export {
  isIdentifierNode,
  isVariableDeclarator,
  isObjectExpression,
  isLiteralNode,
  isPropertyNode,
  isPropertyAFunctionNode,
  getAST,
  extractInfoFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObjectWithAST,
  ECMA_VERSION,
  SourceType,
  NodeTypes,
};

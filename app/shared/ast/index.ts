import {
  ObjectExpression,
  PropertyNode,
  isIdentifierNode,
  isVariableDeclarator,
  isObjectExpression,
  isLiteralNode,
  isPropertyNode,
  isPropertyAFunctionNode,
  isCallExpressionNode,
  getAST,
  extractIdentifierInfoFromCode,
  entityRefactorFromCode,
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

// action creator
import { getTextArgumentAtPosition } from "./src/actionCreator";

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
  isCallExpressionNode,
  getAST,
  extractIdentifierInfoFromCode,
  entityRefactorFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObjectWithAST,
  ECMA_VERSION,
  SourceType,
  NodeTypes,
  getTextArgumentAtPosition
};

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
import {
  parseJSObject,
  isJSFunctionProperty,
  TParsedJSProperty,
  JSPropertyPosition,
} from "./src/jsObject";

// types or intefaces should be exported with type keyword, while enums can be exported like normal functions
export type {
  ObjectExpression,
  PropertyNode,
  MemberExpressionData,
  IdentifierInfo,
  TParsedJSProperty,
  JSPropertyPosition,
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
  entityRefactorFromCode,
  extractInvalidTopLevelMemberExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObject,
  ECMA_VERSION,
  SourceType,
  NodeTypes,
  isJSFunctionProperty,
};

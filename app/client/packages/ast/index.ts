import type {
  ObjectExpression,
  PropertyNode,
  MemberExpressionData,
  IdentifierInfo,
  AssignmentExpressionData,
} from "./src";
import {
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
  extractExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  isFunctionPresent,
  getMemberExpressionObjectFromProperty,
} from "./src";

// constants
import { ECMA_VERSION, SourceType, NodeTypes } from "./src/constants";

// JSObjects
import type {
  TParsedJSProperty,
  JSPropertyPosition,
  JSVarProperty,
  JSFunctionProperty,
} from "./src/jsObject";
import { parseJSObject, isJSFunctionProperty } from "./src/jsObject";

// action creator
import {
  getTextArgumentAtPosition,
  setTextArgumentAtPosition,
  getEnumArgumentAtPosition,
  setEnumArgumentAtPosition,
  getModalName,
  setModalName,
  getFuncExpressionAtPosition,
  getFunction,
  replaceActionInQuery,
  setCallbackFunctionField,
  getActionBlocks,
  getFunctionBodyStatements,
  getMainAction,
  getFunctionName,
  setObjectAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
  getFunctionArguments,
  getFunctionNameFromJsObjectExpression,
  getCallExpressions,
  canTranslateToUI,
  getFunctionParams,
  getQueryParam,
  setQueryParam,
  checkIfCatchBlockExists,
  checkIfThenBlockExists,
  checkIfArgumentExistAtPosition,
} from "./src/actionCreator";

// peekOverlay
import type { PeekOverlayExpressionIdentifierOptions } from "./src/peekOverlay";
import { PeekOverlayExpressionIdentifier } from "./src/peekOverlay";

// types or interfaces should be exported with type keyword, while enums can be exported like normal functions
export type {
  ObjectExpression,
  PropertyNode,
  MemberExpressionData,
  IdentifierInfo,
  TParsedJSProperty,
  JSPropertyPosition,
  PeekOverlayExpressionIdentifierOptions,
  AssignmentExpressionData,
  JSVarProperty,
  JSFunctionProperty,
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
  extractExpressionsFromCode,
  getFunctionalParamsFromNode,
  isTypeOfFunction,
  parseJSObject,
  ECMA_VERSION,
  SourceType,
  NodeTypes,
  getTextArgumentAtPosition,
  getEnumArgumentAtPosition,
  getModalName,
  setModalName,
  setTextArgumentAtPosition,
  setEnumArgumentAtPosition,
  getFuncExpressionAtPosition,
  getFunction,
  replaceActionInQuery,
  setCallbackFunctionField,
  getActionBlocks,
  getFunctionBodyStatements,
  getMainAction,
  getFunctionName,
  setObjectAtPosition,
  getThenCatchBlocksFromQuery,
  setThenBlockInQuery,
  setCatchBlockInQuery,
  getFunctionArguments,
  getFunctionNameFromJsObjectExpression,
  getCallExpressions,
  canTranslateToUI,
  getFunctionParams,
  getQueryParam,
  setQueryParam,
  checkIfThenBlockExists,
  checkIfCatchBlockExists,
  checkIfArgumentExistAtPosition,
  isJSFunctionProperty,
  isFunctionPresent,
  PeekOverlayExpressionIdentifier,
  getMemberExpressionObjectFromProperty,
};

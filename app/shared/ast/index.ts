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
} from './src/index';

import { ExtraLibrary } from './src/constants';

// constants
import {
  ECMA_VERSION,
  SourceType,
  NodeTypes,
  extraLibraries,
  extraLibrariesNames,
  GLOBAL_FUNCTIONS,
  GLOBAL_WORKER_SCOPE_IDENTIFIERS,
  JAVASCRIPT_KEYWORDS,
} from './src/constants';

// JSObjects
import { parseJSObjectWithAST } from './src/jsObject';

// types or intefaces should be exported with type keyword, while enums can be exported like normal functions
export type {
  ObjectExpression,
  PropertyNode,
  MemberExpressionData,
  ExtraLibrary,
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
  extraLibraries,
  GLOBAL_FUNCTIONS,
  GLOBAL_WORKER_SCOPE_IDENTIFIERS,
  extraLibrariesNames,
  JAVASCRIPT_KEYWORDS,
};

export const ECMA_VERSION = 11;

/* Indicates the mode the code should be parsed in. 
This influences global strict mode and parsing of import and export declarations.
*/
export enum SourceType {
  script = "script",
  module = "module",
}

// Each node has an attached type property which further defines
// what all properties can the node have.
// We will just define the ones we are working with
export enum NodeTypes {
  Identifier = "Identifier",
  AssignmentPattern = "AssignmentPattern",
  Literal = "Literal",
  Property = "Property",
  RestElement = "RestElement",
  ObjectPattern = "ObjectPattern",
  ArrayPattern = "ArrayPattern",
  // Declaration - https://github.com/estree/estree/blob/master/es5.md#declarations
  FunctionDeclaration = "FunctionDeclaration",
  ExportDefaultDeclaration = "ExportDefaultDeclaration",
  VariableDeclarator = "VariableDeclarator",
  // Expression - https://github.com/estree/estree/blob/master/es5.md#expressions
  MemberExpression = "MemberExpression",
  FunctionExpression = "FunctionExpression",
  ArrowFunctionExpression = "ArrowFunctionExpression",
  AssignmentExpression = "AssignmentExpression",
  ObjectExpression = "ObjectExpression",
  ArrayExpression = "ArrayExpression",
  ThisExpression = "ThisExpression",
  CallExpression = "CallExpression",
  BinaryExpression = "BinaryExpression",
  ExpressionStatement = "ExpressionStatement",
  BlockStatement = "BlockStatement",
  ConditionalExpression = "ConditionalExpression",
  AwaitExpression = "AwaitExpression",
}

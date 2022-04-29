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
  MemberExpression = "MemberExpression",
  Identifier = "Identifier",
  VariableDeclarator = "VariableDeclarator",
  FunctionDeclaration = "FunctionDeclaration",
  FunctionExpression = "FunctionExpression",
  AssignmentPattern = "AssignmentPattern",
  Literal = "Literal",
  ExportDefaultDeclaration = "ExportDefaultDeclaration",
  Property = "Property",
  ArrowFunctionExpression = "ArrowFunctionExpression",
}

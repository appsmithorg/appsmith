import type { Node, SourceLocation, Options, Comment } from "acorn";
import { parse } from "acorn";
import { ancestor, simple } from "acorn-walk";
import { ECMA_VERSION, NodeTypes } from "./constants";
import { has, isFinite, isNil, isString, toPath } from "lodash";
import { getStringValue, isTrueObject, sanitizeScript } from "./utils";
import { jsObjectDeclaration } from "./jsObject";
import { attachComments } from "astravel";
import { generate } from "astring";
/*
 * Valuable links:
 *
 * * ESTree spec: Javascript AST is called ESTree.
 * Each es version has its md file in the repo to find features
 * implemented and their node type
 * https://github.com/estree/estree
 *
 * * Acorn: The parser we use to get the AST
 * https://github.com/acornjs/acorn
 *
 * * Acorn walk: The walker we use to traverse the AST
 * https://github.com/acornjs/acorn/tree/master/acorn-walk
 *
 * * AST Explorer: Helpful web tool to see ASTs and its parts
 * https://astexplorer.net/
 *
 */

type Pattern =
  | IdentifierNode
  | AssignmentPatternNode
  | ArrayPatternNode
  | ObjectPatternNode
  | RestElementNode;
type Expression = Node;
export type ArgumentTypes =
  | LiteralNode
  | ArrowFunctionExpressionNode
  | ObjectExpression
  | MemberExpressionNode
  | CallExpressionNode
  | BinaryExpressionNode
  | BlockStatementNode
  | IdentifierNode;
// doc: https://github.com/estree/estree/blob/master/es5.md#memberexpression
export interface MemberExpressionNode extends Node {
  type: NodeTypes.MemberExpression;
  object: MemberExpressionNode | IdentifierNode | CallExpressionNode;
  property: IdentifierNode | LiteralNode;
  computed: boolean;
  // doc: https://github.com/estree/estree/blob/master/es2020.md#chainexpression
  optional?: boolean;
}

export interface BinaryExpressionNode extends Node {
  type: NodeTypes.BinaryExpression;
  left: BinaryExpressionNode | IdentifierNode;
  right: BinaryExpressionNode | IdentifierNode;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#identifier
export interface IdentifierNode extends Node {
  type: NodeTypes.Identifier;
  name: string;
}

export interface ArrayPatternNode extends Node {
  type: NodeTypes.ArrayPattern;
  elements: Array<Pattern | null>;
}

export interface AssignmentProperty extends Node {
  type: NodeTypes.Property;
  key: Expression;
  value: Pattern;
  kind: "init";
  method: false;
  shorthand: boolean;
  computed: boolean;
}

export interface RestElementNode extends Node {
  type: NodeTypes.RestElement;
  argument: Pattern;
}

export interface ObjectPatternNode extends Node {
  type: NodeTypes.ObjectPattern;
  properties: Array<AssignmentProperty | RestElementNode>;
}

//Using this to handle the Variable property refactor
interface RefactorIdentifierNode extends Node {
  type: NodeTypes.Identifier;
  name: string;
  property?: IdentifierNode;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#variabledeclarator
interface VariableDeclaratorNode extends Node {
  type: NodeTypes.VariableDeclarator;
  id: IdentifierNode;
  init: Expression | null;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#functions
interface Function extends Node {
  id: IdentifierNode | null;
  params: Pattern[];
}

// doc: https://github.com/estree/estree/blob/master/es5.md#functiondeclaration
interface FunctionDeclarationNode extends Node, Function {
  type: NodeTypes.FunctionDeclaration;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#functionexpression
interface FunctionExpressionNode extends Expression, Function {
  type: NodeTypes.FunctionExpression;
  async: boolean;
}

export interface ArrowFunctionExpressionNode extends Expression, Function {
  type: NodeTypes.ArrowFunctionExpression;
  async: boolean;
}

export interface ObjectExpression extends Expression {
  type: NodeTypes.ObjectExpression;
  properties: Array<PropertyNode>;
}

// doc: https://github.com/estree/estree/blob/master/es2015.md#assignmentpattern
interface AssignmentPatternNode extends Node {
  type: NodeTypes.AssignmentPattern;
  left: Pattern;
  right: ArgumentTypes;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#literal
export interface LiteralNode extends Node {
  type: NodeTypes.Literal;
  value: string | boolean | null | number | RegExp;
  raw: string;
}

export interface CallExpressionNode extends Node {
  type: NodeTypes.CallExpression;
  callee: CallExpressionNode | IdentifierNode | MemberExpressionNode;
  arguments: ArgumentTypes[];
}

// https://github.com/estree/estree/blob/master/es5.md#thisexpression
export interface ThisExpressionNode extends Expression {
  type: "ThisExpression";
}

// https://github.com/estree/estree/blob/master/es5.md#conditionalexpression
export interface ConditionalExpressionNode extends Expression {
  type: "ConditionalExpression";
  test: Expression;
  alternate: Expression;
  consequent: Expression;
}

// https://github.com/estree/estree/blob/master/es2017.md#awaitexpression
export interface AwaitExpressionNode extends Expression {
  type: "AwaitExpression";
  argument: Expression;
}

export interface BlockStatementNode extends Node {
  type: "BlockStatement";
  body: [Node];
}

interface NodeList {
  references: Set<string>;
  functionalParams: Set<string>;
  variableDeclarations: Set<string>;
  identifierList: Array<IdentifierNode>;
}

// https://github.com/estree/estree/blob/master/es5.md#property
export interface PropertyNode extends Node {
  type: NodeTypes.Property;
  key: LiteralNode | IdentifierNode;
  value: Node;
  kind: "init" | "get" | "set";
}

export interface ExpressionStatement extends Node {
  type: "ExpressionStatement";
  expression: Expression;
}

export interface Program extends Node {
  type: "Program";
  body: [Directive | Statement];
}

export type Statement = Node;

export interface Directive extends ExpressionStatement {
  expression: LiteralNode;
  directive: string;
}

export interface ExportDefaultDeclarationNode extends Node {
  declaration: Node;
}

// Node with location details
export type NodeWithLocation<NodeType> = NodeType & {
  loc: SourceLocation;
};

type AstOptions = Omit<Options, "ecmaVersion">;

interface EntityRefactorResponse {
  isSuccess: boolean;
  body: { script: string; refactorCount: number } | { error: string };
}

/* We need these functions to typescript casts the nodes with the correct types */
export const isIdentifierNode = (node: Node): node is IdentifierNode => {
  return node.type === NodeTypes.Identifier;
};

export const isMemberExpressionNode = (
  node: Node,
): node is MemberExpressionNode => {
  return node.type === NodeTypes.MemberExpression;
};

export const isThisExpressionNode = (
  node: Node,
): node is ThisExpressionNode => {
  return node.type === NodeTypes.ThisExpression;
};

export const isConditionalExpressionNode = (
  node: Node,
): node is ConditionalExpressionNode =>
  node.type === NodeTypes.ConditionalExpression;

export const isAwaitExpressionNode = (
  node: Node,
): node is AwaitExpressionNode => node.type === NodeTypes.AwaitExpression;

export const isBinaryExpressionNode = (
  node: Node,
): node is BinaryExpressionNode => {
  return node.type === NodeTypes.BinaryExpression;
};

export const isVariableDeclarator = (
  node: Node,
): node is VariableDeclaratorNode => {
  return node.type === NodeTypes.VariableDeclarator;
};

const isFunctionDeclaration = (node: Node): node is FunctionDeclarationNode => {
  return node.type === NodeTypes.FunctionDeclaration;
};

const isFunctionExpression = (node: Node): node is FunctionExpressionNode => {
  return node.type === NodeTypes.FunctionExpression;
};

export const isArrowFunctionExpression = (
  node: Node,
): node is ArrowFunctionExpressionNode => {
  return node.type === NodeTypes.ArrowFunctionExpression;
};

export const isAssignmentExpression = (
  node: Node,
): node is AssignmentExpressionNode => {
  return node.type === NodeTypes.AssignmentExpression;
};

export const isObjectExpression = (node: Node): node is ObjectExpression => {
  return node.type === NodeTypes.ObjectExpression;
};

const isAssignmentPatternNode = (node: Node): node is AssignmentPatternNode => {
  return node.type === NodeTypes.AssignmentPattern;
};

export const isArrayPatternNode = (node: Node): node is ArrayPatternNode => {
  return node.type === NodeTypes.ArrayPattern;
};

export const isObjectPatternNode = (node: Node): node is ObjectPatternNode => {
  return node.type === NodeTypes.ObjectPattern;
};

export const isRestElementNode = (node: Node): node is RestElementNode => {
  return node.type === NodeTypes.RestElement;
};

export const isLiteralNode = (node: Node): node is LiteralNode => {
  return node.type === NodeTypes.Literal;
};

export const isPropertyNode = (node: Node): node is PropertyNode => {
  return node.type === NodeTypes.Property;
};

export const isCallExpressionNode = (
  node: Node,
): node is CallExpressionNode => {
  return node.type === NodeTypes.CallExpression;
};

export const isBlockStatementNode = (
  node: Node,
): node is BlockStatementNode => {
  return node.type === NodeTypes.BlockStatement;
};

export const isExpressionStatementNode = (
  node: Node,
): node is ExpressionStatement => {
  return node.type === NodeTypes.ExpressionStatement;
};

export const isExportDefaultDeclarationNode = (
  node: Node,
): node is ExportDefaultDeclarationNode => {
  return node.type === NodeTypes.ExportDefaultDeclaration;
};

export const isPropertyAFunctionNode = (
  node: Node,
): node is ArrowFunctionExpressionNode | FunctionExpressionNode => {
  return (
    node.type === NodeTypes.ArrowFunctionExpression ||
    node.type === NodeTypes.FunctionExpression
  );
};

const isArrayAccessorNode = (node: Node): node is MemberExpressionNode => {
  return (
    isMemberExpressionNode(node) &&
    node.computed &&
    isLiteralNode(node.property) &&
    isFinite(node.property.value)
  );
};

export const wrapCode = (code: string) => {
  return `
    (function() {
      return ${code}
    })
  `;
};

//Tech-debt: should upgrade this to better logic
//Used slice for a quick resolve of critical bug
const unwrapCode = (code: string) => {
  const unwrapedCode = code.slice(32);

  return unwrapedCode.slice(0, -10);
};

const getFunctionalParamNamesFromNode = (
  node:
    | FunctionDeclarationNode
    | FunctionExpressionNode
    | ArrowFunctionExpressionNode,
) => {
  return Array.from(getFunctionalParamsFromNode(node)).map(
    (functionalParam) => functionalParam.paramName,
  );
};

// Memoize the ast generation code to improve performance.
// Since this will be used by both the server and the client, we want to prevent regeneration of ast
// for the the same code snippet
export const getAST = (code: string, options?: AstOptions) =>
  parse(code, { ...options, ecmaVersion: ECMA_VERSION });

export const attachCommentsToAst = (
  ast: Node,
  commentArray: Array<Comment>,
) => {
  return attachComments(ast, commentArray);
};
/**
 * An AST based extractor that fetches all possible references in a given
 * piece of code. We use this to get any references to the global entities in Appsmith
 * and create dependencies on them. If the reference was updated, the given piece of code
 * should run again.
 * @param code: The piece of script where references need to be extracted from
 */

export interface IdentifierInfo {
  references: string[];
  functionalParams: string[];
  variables: string[];
  isError: boolean;
}
export const extractIdentifierInfoFromCode = (
  code: string,
  evaluationVersion: number,
  invalidIdentifiers?: Record<string, unknown>,
): IdentifierInfo => {
  let ast: Node = { end: 0, start: 0, type: "" };

  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    /* wrapCode - Wrapping code in a function, since all code/script get wrapped with a function during evaluation.
       Some syntax won't be valid unless they're at the RHS of a statement.
       Since we're assigning all code/script to RHS during evaluation, we do the same here.
       So that during ast parse, those errors are neglected.
    */
    /* e.g. IIFE without braces
      function() { return 123; }() -> is invalid
      let result = function() { return 123; }() -> is valid
    */
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode);
    const { functionalParams, references, variableDeclarations }: NodeList =
      ancestorWalk(ast);
    const referencesArr = Array.from(references).filter((reference) => {
      // To remove references derived from declared variables and function params,
      // We extract the topLevelIdentifier Eg. Api1.name => Api1
      const topLevelIdentifier = toPath(reference)[0];

      return !(
        functionalParams.has(topLevelIdentifier) ||
        variableDeclarations.has(topLevelIdentifier) ||
        has(invalidIdentifiers, topLevelIdentifier)
      );
    });

    return {
      references: referencesArr,
      functionalParams: Array.from(functionalParams),
      variables: Array.from(variableDeclarations),
      isError: false,
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Syntax error. Ignore and return empty list
      return {
        references: [],
        functionalParams: [],
        variables: [],
        isError: true,
      };
    }

    throw e;
  }
};

export const entityRefactorFromCode = (
  script: string,
  oldName: string,
  newName: string,
  isJSObject: boolean,
  evaluationVersion: number,
  invalidIdentifiers?: Record<string, unknown>,
): EntityRefactorResponse => {
  //Sanitizing leads to removal of special charater.
  //Hence we are not sanatizing the script. Fix(#18492)
  //If script is a JSObject then replace export default to decalartion.
  if (isJSObject) script = jsObjectToCode(script);
  else script = wrapCode(script);

  let ast: Node = { end: 0, start: 0, type: "" };
  //Copy of script to refactor
  let refactorScript = script;
  //Difference in length of oldName and newName
  const nameLengthDiff: number = newName.length - oldName.length;
  //Offset index used for deciding location of oldName.
  let refactorOffset = 0;
  //Count of refactors on the script
  let refactorCount = 0;

  try {
    ast = getAST(script);
    const {
      functionalParams,
      identifierList,
      references,
      variableDeclarations,
    }: NodeList = ancestorWalk(ast);
    const identifierArray = Array.from(
      identifierList,
    ) as Array<RefactorIdentifierNode>;
    //To handle if oldName has property ("JSObject.myfunc")
    const oldNameArr = oldName.split(".");
    const referencesArr = Array.from(references).filter((reference) => {
      // To remove references derived from declared variables and function params,
      // We extract the topLevelIdentifier Eg. Api1.name => Api1
      const topLevelIdentifier = toPath(reference)[0];

      return !(
        functionalParams.has(topLevelIdentifier) ||
        variableDeclarations.has(topLevelIdentifier) ||
        has(invalidIdentifiers, topLevelIdentifier)
      );
    });

    //Traverse through all identifiers in the script
    identifierArray.forEach((identifier) => {
      if (identifier.name === oldNameArr[0]) {
        let index = 0;

        while (index < referencesArr.length) {
          if (identifier.name === referencesArr[index].split(".")[0]) {
            //Replace the oldName by newName
            //Get start index from node and get subarray from index 0 till start
            //Append above with new name
            //Append substring from end index from the node till end of string
            //Offset variable is used to alter the position based on `refactorOffset`
            //In case of nested JS action get end postion fro the property.
            ///Default end index
            let endIndex = identifier.end;
            const propertyNode = identifier.property;
            //Flag variable : true if property should be updated
            //false if property should not be updated
            const propertyCondFlag =
              oldNameArr.length > 1 &&
              propertyNode &&
              oldNameArr[1] === propertyNode.name;

            //Condition to validate if Identifier || Property should be updated??
            if (oldNameArr.length === 1 || propertyCondFlag) {
              //Condition to extend end index in case of property match
              if (propertyCondFlag && propertyNode) {
                endIndex = propertyNode.end;
              }

              refactorScript =
                refactorScript.substring(0, identifier.start + refactorOffset) +
                newName +
                refactorScript.substring(endIndex + refactorOffset);
              refactorOffset += nameLengthDiff;
              ++refactorCount;
              //We are only looking for one match in refrence for the identifier name.
              break;
            }
          }

          index++;
        }
      }
    });

    //If script is a JSObject then revert decalartion to export default.
    if (isJSObject) refactorScript = jsCodeToObject(refactorScript);
    else refactorScript = unwrapCode(refactorScript);

    return {
      isSuccess: true,
      body: { script: refactorScript, refactorCount },
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Syntax error. Ignore and return empty list
      return { isSuccess: false, body: { error: "Syntax Error" } };
    }

    throw e;
  }
};

export interface functionParam {
  paramName: string;
  defaultValue: unknown;
}

export const getFunctionalParamsFromNode = (
  node:
    | FunctionDeclarationNode
    | FunctionExpressionNode
    | ArrowFunctionExpressionNode,
  needValue = false,
  code = "",
): Set<functionParam> => {
  const functionalParams = new Set<functionParam>();

  node.params.forEach((paramNode) => {
    if (isIdentifierNode(paramNode)) {
      functionalParams.add({
        paramName: paramNode.name,
        defaultValue: undefined,
      });
    } else if (isAssignmentPatternNode(paramNode)) {
      if (isIdentifierNode(paramNode.left)) {
        const paramName = paramNode.left.name;

        if (!needValue || !code) {
          functionalParams.add({ paramName, defaultValue: undefined });
        } else {
          const defaultValueInString = code.slice(
            paramNode.right.start,
            paramNode.right.end,
          );
          const defaultValue =
            paramNode.right.type === "Literal" &&
            typeof paramNode.right.value === "string"
              ? paramNode.right.value
              : `{{${defaultValueInString}}}`;

          functionalParams.add({
            paramName,
            defaultValue,
          });
        }
      } else if (
        isObjectPatternNode(paramNode.left) ||
        isArrayPatternNode(paramNode.left)
      ) {
        functionalParams.add({
          paramName: "",
          defaultValue: undefined,
        });
      }
      // The below computations are very basic and can be evolved into nested
      // parsing logic to find param and it's default value.
    } else if (isObjectPatternNode(paramNode)) {
      functionalParams.add({
        paramName: "",
        defaultValue: `{{{}}}`,
      });
    } else if (isArrayPatternNode(paramNode)) {
      functionalParams.add({
        paramName: "",
        defaultValue: "{{[]}}",
      });
    } else if (isRestElementNode(paramNode)) {
      if ("name" in paramNode.argument) {
        functionalParams.add({
          paramName: paramNode.argument.name,
          defaultValue: undefined,
        });
      }
    }
  });

  return functionalParams;
};

const constructFinalMemberExpIdentifier = (
  node: MemberExpressionNode,
  child = "",
): string => {
  const propertyAccessor = getPropertyAccessor(node.property);

  if (isIdentifierNode(node.object)) {
    return `${node.object.name}${propertyAccessor}${child}`;
  } else {
    const propertyAccessor = getPropertyAccessor(node.property);
    const nestedChild = `${propertyAccessor}${child}`;

    return constructFinalMemberExpIdentifier(
      node.object as MemberExpressionNode,
      nestedChild,
    );
  }
};

const getPropertyAccessor = (propertyNode: IdentifierNode | LiteralNode) => {
  if (isIdentifierNode(propertyNode)) {
    return `.${propertyNode.name}`;
  } else if (isLiteralNode(propertyNode) && isString(propertyNode.value)) {
    // is string literal search a['b']
    return `.${propertyNode.value}`;
  } else if (isLiteralNode(propertyNode) && isFinite(propertyNode.value)) {
    // is array index search - a[9]
    return `[${propertyNode.value}]`;
  }
};

export const isTypeOfFunction = (type: string) => {
  return (
    type === NodeTypes.ArrowFunctionExpression ||
    type === NodeTypes.FunctionExpression
  );
};

export interface MemberExpressionData {
  property: NodeWithLocation<IdentifierNode | LiteralNode>;
  object: NodeWithLocation<IdentifierNode>;
}

export interface AssignmentExpressionData {
  property: NodeWithLocation<IdentifierNode | LiteralNode>;
  object: NodeWithLocation<IdentifierNode | MemberExpressionNode>;
  parentNode: NodeWithLocation<AssignmentExpressionNode>;
}

export interface CallExpressionData {
  property: NodeWithLocation<IdentifierNode>;
  params: NodeWithLocation<MemberExpressionNode | LiteralNode>[];
}

// This interface is used for storing call expression nodes with callee as member node
// example of such case is when a function is called on object like obj.func()
// This is required to understand whether appsmith.store.test.func() is present in script
// in order to display mutation error on such statements.
export interface MemberCallExpressionData {
  property: NodeWithLocation<MemberExpressionNode | LiteralNode>;
  object: NodeWithLocation<MemberExpressionNode>;
  parentNode: NodeWithLocation<CallExpressionNode>;
}

export interface AssignmentExpressionNode extends Node {
  operator: string;
  left: Expression;
  Right: Expression;
}

/** Function returns Invalid top-level member expressions from code
 * @param code
 * @param data
 * @param evaluationVersion
 * @returns information about all invalid property/method assessment in code
 * @example Given data {
 * JSObject1: {
 * name:"JSObject",
 * data:[]
 * },
 * Api1:{
 * name: "Api1",
 * data: []
 * }
 * },
 * For code {{Api1.name + JSObject.unknownProperty}}, function returns information about "JSObject.unknownProperty" node.
 */
export const extractExpressionsFromCode = (
  code: string,
  data: Record<string, any>,
  evaluationVersion: number,
): {
  invalidTopLevelMemberExpressionsArray: MemberExpressionData[];
  assignmentExpressionsData: AssignmentExpressionData[];
  callExpressionsData: CallExpressionData[];
  memberCallExpressionData: MemberCallExpressionData[];
} => {
  const assignmentExpressionsData = new Set<AssignmentExpressionData>();
  const callExpressionsData = new Set<CallExpressionData>();
  const memberCallExpressionData = new Set<MemberCallExpressionData>();
  const invalidTopLevelMemberExpressions = new Set<MemberExpressionData>();
  const variableDeclarations = new Set<string>();
  let functionalParams = new Set<string>();
  let ast: Node = { end: 0, start: 0, type: "" };

  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode, { locations: true });
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Syntax error. Ignore and return empty list
      return {
        invalidTopLevelMemberExpressionsArray: [],
        assignmentExpressionsData: [],
        callExpressionsData: [],
        memberCallExpressionData: [],
      };
    }

    throw e;
  }
  simple(ast, {
    MemberExpression(node: Node) {
      const { computed, object, property } = node as MemberExpressionNode;

      // We are only interested in top-level MemberExpression nodes
      // Eg. for Api1.data.name, we are only interested in Api1.data
      if (!isIdentifierNode(object)) return;

      if (!(object.name in data) || !isTrueObject(data[object.name])) return;

      // For computed member expressions (assessed via [], eg. JSObject1["name"] ),
      // We are only interested in strings
      if (
        isLiteralNode(property) &&
        isString(property.value) &&
        !(property.value in data[object.name])
      ) {
        invalidTopLevelMemberExpressions.add({
          object,
          property,
        } as MemberExpressionData);
      }

      // We ignore computed member expressions if property is an identifier (JSObject[name])
      // This is because we can't statically determine what the value of the identifier might be.
      if (
        isIdentifierNode(property) &&
        !computed &&
        !(property.name in data[object.name])
      ) {
        invalidTopLevelMemberExpressions.add({
          object,
          property,
        } as MemberExpressionData);
      }
    },
    VariableDeclarator(node: Node) {
      if (isVariableDeclarator(node)) {
        variableDeclarations.add(node.id.name);
      }
    },
    FunctionDeclaration(node: Node) {
      if (!isFunctionDeclaration(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
    FunctionExpression(node: Node) {
      if (!isFunctionExpression(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
    ArrowFunctionExpression(node: Node) {
      if (!isArrowFunctionExpression(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
    AssignmentExpression(node: Node) {
      if (
        !isAssignmentExpression(node) ||
        node.operator !== "=" ||
        !isMemberExpressionNode(node.left)
      )
        return;

      const { object, property } = node.left;

      assignmentExpressionsData.add({
        object,
        property,
        parentNode: node,
      } as AssignmentExpressionData);
    },
    CallExpression(node: Node) {
      if (isCallExpressionNode(node)) {
        if (isIdentifierNode(node.callee)) {
          callExpressionsData.add({
            property: node.callee,
            params: node.arguments,
          } as CallExpressionData);
        }

        if (isMemberExpressionNode(node.callee)) {
          const { object, property } = node.callee;

          memberCallExpressionData.add({
            object,
            property,
            parentNode: node,
          } as MemberCallExpressionData);
        }
      }
    },
  });

  const invalidTopLevelMemberExpressionsArray = Array.from(
    invalidTopLevelMemberExpressions,
  ).filter((MemberExpression) => {
    return !(
      variableDeclarations.has(MemberExpression.object.name) ||
      functionalParams.has(MemberExpression.object.name)
    );
  });

  return {
    invalidTopLevelMemberExpressionsArray,
    assignmentExpressionsData: [...assignmentExpressionsData],
    callExpressionsData: [...callExpressionsData],
    memberCallExpressionData: [...memberCallExpressionData],
  };
};

const ancestorWalk = (ast: Node): NodeList => {
  //List of all Identifier nodes with their property(if exists).
  const identifierList = new Array<RefactorIdentifierNode>();
  // List of all references found
  const references = new Set<string>();
  // List of variables declared within the script. All identifiers and member expressions derived from declared variables will be removed
  const variableDeclarations = new Set<string>();
  // List of functional params declared within the script. All identifiers and member expressions derived from functional params will be removed
  let functionalParams = new Set<string>();

  /*
   * We do an ancestor walk on the AST in order to extract all references. For example, for member expressions and identifiers, we need to know
   * what surrounds the identifier (its parent and ancestors), ancestor walk will give that information in the callback
   * doc: https://github.com/acornjs/acorn/tree/master/acorn-walk
   */
  ancestor(ast, {
    Identifier(node: Node, ancestors: Node[]) {
      /*
       * We are interested in identifiers. Due to the nature of AST, Identifier nodes can
       * also be nested inside MemberExpressions. For deeply nested object references, there
       * could be nesting of many MemberExpressions. To find the final reference, we will
       * try to find the top level MemberExpression that does not have a MemberExpression parent.
       * */
      let candidateTopLevelNode: IdentifierNode | MemberExpressionNode =
        node as IdentifierNode;
      let depth = ancestors.length - 2; // start "depth" with first parent

      while (depth > 0) {
        const parent = ancestors[depth];

        if (
          isMemberExpressionNode(parent) &&
          /* Member expressions that are "computed" (with [ ] search)
             and the ones that have optional chaining ( a.b?.c )
             will be considered top level node.
             We will stop looking for further parents */
          /* "computed" exception - isArrayAccessorNode
             Member expressions that are array accessors with static index - [9]
             will not be considered top level.
             We will continue looking further. */
          (!parent.computed || isArrayAccessorNode(parent)) &&
          !parent.optional
        ) {
          candidateTopLevelNode = parent;
          depth = depth - 1;
        } else {
          // Top level found
          break;
        }
      }

      //If parent is a Member expression then attach property to the Node.
      //else push Identifier Node.
      const parentNode = ancestors[ancestors.length - 2];

      if (isMemberExpressionNode(parentNode)) {
        identifierList.push({
          ...(node as IdentifierNode),
          property: parentNode.property as IdentifierNode,
        });
      } else identifierList.push(node as RefactorIdentifierNode);

      if (isIdentifierNode(candidateTopLevelNode)) {
        // If the node is an Identifier, just save that
        references.add(candidateTopLevelNode.name);
      } else {
        // For MemberExpression Nodes, we will construct a final reference string and then add
        // it to the references list
        const memberExpIdentifier = constructFinalMemberExpIdentifier(
          candidateTopLevelNode,
        );

        references.add(memberExpIdentifier);
      }
    },
    VariableDeclarator(node: Node) {
      // keep a track of declared variables so they can be
      // removed from the final list of references
      if (isVariableDeclarator(node)) {
        variableDeclarations.add(node.id.name);
      }
    },
    FunctionDeclaration(node: Node) {
      // params in function declarations are also counted as references so we keep
      // track of them and remove them from the final list of references
      if (!isFunctionDeclaration(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
    FunctionExpression(node: Node) {
      // params in function expressions are also counted as references so we keep
      // track of them and remove them from the final list of references
      if (!isFunctionExpression(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
    ArrowFunctionExpression(node: Node) {
      // params in arrow function expressions are also counted as references so we keep
      // track of them and remove them from the final list of references
      if (!isArrowFunctionExpression(node)) return;

      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamNamesFromNode(node),
      ]);
    },
  });

  return {
    references,
    functionalParams,
    variableDeclarations,
    identifierList,
  };
};

//Replace export default by a variable declaration.
//This is required for acorn to parse code into AST.
const jsObjectToCode = (script: string) => {
  return script.replace(/export default/g, jsObjectDeclaration);
};

//Revert the string replacement from 'jsObjectToCode'.
//variable declaration is replaced back by export default.
const jsCodeToObject = (script: string) => {
  return script.replace(jsObjectDeclaration, "export default");
};

export const isFunctionPresent = (
  script: string,
  evaluationVersion: number,
) => {
  try {
    const sanitizedScript = sanitizeScript(script, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });

    let isFunction = false;

    simple(ast, {
      FunctionDeclaration() {
        isFunction = true;
      },
      FunctionExpression() {
        isFunction = true;
      },
      ArrowFunctionExpression() {
        isFunction = true;
      },
    });

    return isFunction;
  } catch (e) {
    return false;
  }
};

export function getMemberExpressionObjectFromProperty(
  propertyName: string,
  code: string,
  evaluationVersion = 2,
) {
  if (!propertyName) return [];

  const memberExpressionObjects = new Set<string>();
  let ast: Node = { end: 0, start: 0, type: "" };

  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode, { locations: true });
    simple(ast, {
      MemberExpression(node: Node) {
        const { object, property } = node as MemberExpressionNode;

        if (!isLiteralNode(property) && !isIdentifierNode(property)) return;

        const propName = isLiteralNode(property)
          ? property.value
          : property.name;

        if (!isNil(propName) && getStringValue(propName) === propertyName) {
          const memberExpressionObjectString = generate(object);

          memberExpressionObjects.add(memberExpressionObjectString);
        }
      },
    });

    return Array.from(memberExpressionObjects);
  } catch (e) {
    return [];
  }
}

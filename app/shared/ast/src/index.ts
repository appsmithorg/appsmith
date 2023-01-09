import { parse, Node, SourceLocation, Options, Comment } from "acorn";
import { ancestor, simple } from "acorn-walk";
import { ECMA_VERSION, NodeTypes } from "./constants/ast";
import { has, isFinite, isString, memoize, toPath } from "lodash";
import { isTrueObject, sanitizeScript } from "./utils";
import { jsObjectDeclaration } from "./jsObject/index";
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

type Pattern = IdentifierNode | AssignmentPatternNode;
type Expression = Node;
// doc: https://github.com/estree/estree/blob/master/es5.md#memberexpression
interface MemberExpressionNode extends Node {
  type: NodeTypes.MemberExpression;
  object: MemberExpressionNode | IdentifierNode;
  property: IdentifierNode | LiteralNode;
  computed: boolean;
  // doc: https://github.com/estree/estree/blob/master/es2020.md#chainexpression
  optional?: boolean;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#identifier
interface IdentifierNode extends Node {
  type: NodeTypes.Identifier;
  name: string;
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
}

interface ArrowFunctionExpressionNode extends Expression, Function {
  type: NodeTypes.ArrowFunctionExpression;
}

export interface ObjectExpression extends Expression {
  type: NodeTypes.ObjectExpression;
  properties: Array<PropertyNode>;
}

// doc: https://github.com/estree/estree/blob/master/es2015.md#assignmentpattern
interface AssignmentPatternNode extends Node {
  type: NodeTypes.AssignmentPattern;
  left: Pattern;
}

// doc: https://github.com/estree/estree/blob/master/es5.md#literal
interface LiteralNode extends Node {
  type: NodeTypes.Literal;
  value: string | boolean | null | number | RegExp;
}

type NodeList = {
  references: Set<string>;
  functionalParams: Set<string>;
  variableDeclarations: Set<string>;
  identifierList: Array<IdentifierNode>;
};

// https://github.com/estree/estree/blob/master/es5.md#property
export interface PropertyNode extends Node {
  type: NodeTypes.Property;
  key: LiteralNode | IdentifierNode;
  value: Node;
  kind: "init" | "get" | "set";
}

// Node with location details
type NodeWithLocation<NodeType> = NodeType & {
  loc: SourceLocation;
};

type AstOptions = Omit<Options, "ecmaVersion">;

type EntityRefactorResponse = {
  isSuccess: boolean;
  body: { script: string; refactorCount: number } | { error: string };
};

/* We need these functions to typescript casts the nodes with the correct types */
export const isIdentifierNode = (node: Node): node is IdentifierNode => {
  return node.type === NodeTypes.Identifier;
};

const isMemberExpressionNode = (node: Node): node is MemberExpressionNode => {
  return node.type === NodeTypes.MemberExpression;
};

export const isVariableDeclarator = (
  node: Node
): node is VariableDeclaratorNode => {
  return node.type === NodeTypes.VariableDeclarator;
};

const isFunctionDeclaration = (node: Node): node is FunctionDeclarationNode => {
  return node.type === NodeTypes.FunctionDeclaration;
};

const isFunctionExpression = (node: Node): node is FunctionExpressionNode => {
  return node.type === NodeTypes.FunctionExpression;
};
const isArrowFunctionExpression = (
  node: Node
): node is ArrowFunctionExpressionNode => {
  return node.type === NodeTypes.ArrowFunctionExpression;
};

export const isObjectExpression = (node: Node): node is ObjectExpression => {
  return node.type === NodeTypes.ObjectExpression;
};

const isAssignmentPatternNode = (node: Node): node is AssignmentPatternNode => {
  return node.type === NodeTypes.AssignmentPattern;
};

export const isLiteralNode = (node: Node): node is LiteralNode => {
  return node.type === NodeTypes.Literal;
};

export const isPropertyNode = (node: Node): node is PropertyNode => {
  return node.type === NodeTypes.Property;
};

export const isPropertyAFunctionNode = (
  node: Node
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

const wrapCode = (code: string) => {
  return `
    (function() {
      return ${code}
    })
  `;
};

const getFunctionalParamNamesFromNode = (
  node:
    | FunctionDeclarationNode
    | FunctionExpressionNode
    | ArrowFunctionExpressionNode
) => {
  return Array.from(getFunctionalParamsFromNode(node)).map(
    (functionalParam) => functionalParam.paramName
  );
};

// Memoize the ast generation code to improve performance.
// Since this will be used by both the server and the client, we want to prevent regeneration of ast
// for the the same code snippet
export const getAST = memoize((code: string, options?: AstOptions) =>
  parse(code, { ...options, ecmaVersion: ECMA_VERSION })
);

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
}
export const extractIdentifierInfoFromCode = (
  code: string,
  evaluationVersion: number,
  invalidIdentifiers?: Record<string, unknown>
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
    let { references, functionalParams, variableDeclarations }: NodeList =
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
    };
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Syntax error. Ignore and return empty list
      return {
        references: [],
        functionalParams: [],
        variables: [],
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
  invalidIdentifiers?: Record<string, unknown>
): EntityRefactorResponse => {
  //Sanitizing leads to removal of special charater.
  //Hence we are not sanatizing the script. Fix(#18492)
  //If script is a JSObject then replace export default to decalartion.
  if (isJSObject) script = jsObjectToCode(script);
  let ast: Node = { end: 0, start: 0, type: "" };
  //Copy of script to refactor
  let refactorScript = script;
  //Difference in length of oldName and newName
  const nameLengthDiff: number = newName.length - oldName.length;
  //Offset index used for deciding location of oldName.
  let refactorOffset: number = 0;
  //Count of refactors on the script
  let refactorCount: number = 0;
  try {
    ast = getAST(script);
    let {
      references,
      functionalParams,
      variableDeclarations,
      identifierList,
    }: NodeList = ancestorWalk(ast);
    const identifierArray = Array.from(
      identifierList
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
            let propertyCondFlag =
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

export type functionParam = { paramName: string; defaultValue: unknown };

export const getFunctionalParamsFromNode = (
  node:
    | FunctionDeclarationNode
    | FunctionExpressionNode
    | ArrowFunctionExpressionNode,
  needValue = false
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
        if (!needValue) {
          functionalParams.add({ paramName, defaultValue: undefined });
        } else {
          // figure out how to get value of paramNode.right for each node type
          // currently we don't use params value, hence skipping it
          // functionalParams.add({
          //   defaultValue: paramNode.right.value,
          // });
        }
      }
    }
  });
  return functionalParams;
};

const constructFinalMemberExpIdentifier = (
  node: MemberExpressionNode,
  child = ""
): string => {
  const propertyAccessor = getPropertyAccessor(node.property);
  if (isIdentifierNode(node.object)) {
    return `${node.object.name}${propertyAccessor}${child}`;
  } else {
    const propertyAccessor = getPropertyAccessor(node.property);
    const nestedChild = `${propertyAccessor}${child}`;
    return constructFinalMemberExpIdentifier(node.object, nestedChild);
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
export const extractInvalidTopLevelMemberExpressionsFromCode = (
  code: string,
  data: Record<string, any>,
  evaluationVersion: number
): MemberExpressionData[] => {
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
      return [];
    }
    throw e;
  }
  simple(ast, {
    MemberExpression(node: Node) {
      const { object, property } = node as MemberExpressionNode;
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
      if (isIdentifierNode(property) && !(property.name in data[object.name])) {
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
  });

  const invalidTopLevelMemberExpressionsArray = Array.from(
    invalidTopLevelMemberExpressions
  ).filter((MemberExpression) => {
    return !(
      variableDeclarations.has(MemberExpression.object.name) ||
      functionalParams.has(MemberExpression.object.name)
    );
  });

  return invalidTopLevelMemberExpressionsArray;
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
          candidateTopLevelNode
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

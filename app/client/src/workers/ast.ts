import { parse, Node } from "acorn";
import { ancestor, simple } from "acorn-walk";
import { ECMA_VERSION, NodeTypes } from "constants/ast";
import { isFinite, isString } from "lodash";
import { sanitizeScript } from "./evaluate";
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

// https://github.com/estree/estree/blob/master/es5.md#property
export interface PropertyNode extends Node {
  type: NodeTypes.Property;
  key: LiteralNode | IdentifierNode;
  value: Node;
  kind: "init" | "get" | "set";
}

/* We need these functions to typescript casts the nodes with the correct types */
export const isIdentifierNode = (node: Node): node is IdentifierNode => {
  return node.type === NodeTypes.Identifier;
};

const isMemberExpressionNode = (node: Node): node is MemberExpressionNode => {
  return node.type === NodeTypes.MemberExpression;
};

const isVariableDeclarator = (node: Node): node is VariableDeclaratorNode => {
  return node.type === NodeTypes.VariableDeclarator;
};

const isFunctionDeclaration = (node: Node): node is FunctionDeclarationNode => {
  return node.type === NodeTypes.FunctionDeclaration;
};

const isFunctionExpression = (node: Node): node is FunctionExpressionNode => {
  return node.type === NodeTypes.FunctionExpression;
};

const isObjectExpression = (node: Node): node is ObjectExpression => {
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

const wrapCode = (code: string) => {
  return `
    (function() {
      return ${code}
    })
  `;
};

export const getAST = (code: string) =>
  parse(code, { ecmaVersion: ECMA_VERSION });

/**
 * An AST based extractor that fetches all possible identifiers in a given
 * piece of code. We use this to get any references to the global entities in Appsmith
 * and create dependencies on them. If the reference was updated, the given piece of code
 * should run again.
 * @param code: The piece of script where identifiers need to be extracted from
 */
export const extractIdentifiersFromCode = (code: string): string[] => {
  // List of all identifiers found
  const identifiers = new Set<string>();
  // List of variables declared within the script. This will be removed from identifier list
  const variableDeclarations = new Set<string>();
  // List of functionalParams found. This will be removed from the identifier list
  let functionalParams = new Set<functionParams>();
  let ast: Node = { end: 0, start: 0, type: "" };
  try {
    const sanitizedScript = sanitizeScript(code);
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
  } catch (e) {
    if (e instanceof SyntaxError) {
      // Syntax error. Ignore and return 0 identifiers
      return [];
    }
    throw e;
  }

  /*
   * We do an ancestor walk on the AST to get all identifiers. Since we need to know
   * what surrounds the identifier, ancestor walk will give that information in the callback
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
      let candidateTopLevelNode:
        | IdentifierNode
        | MemberExpressionNode = node as IdentifierNode;
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
      if (isIdentifierNode(candidateTopLevelNode)) {
        // If the node is an Identifier, just save that
        identifiers.add(candidateTopLevelNode.name);
      } else {
        // For MemberExpression Nodes, we will construct a final reference string and then add
        // it to the identifier list
        const memberExpIdentifier = constructFinalMemberExpIdentifier(
          candidateTopLevelNode,
        );
        identifiers.add(memberExpIdentifier);
      }
    },
    VariableDeclarator(node: Node) {
      // keep a track of declared variables so they can be
      // subtracted from the final list of identifiers
      if (isVariableDeclarator(node)) {
        variableDeclarations.add(node.id.name);
      }
    },
    FunctionDeclaration(node: Node) {
      // params in function declarations are also counted as identifiers so we keep
      // track of them and remove them from the final list of identifiers
      if (!isFunctionDeclaration(node)) return;
      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamsFromNode(node),
      ]);
    },
    FunctionExpression(node: Node) {
      // params in function experssions are also counted as identifiers so we keep
      // track of them and remove them from the final list of identifiers
      if (!isFunctionExpression(node)) return;
      functionalParams = new Set([
        ...functionalParams,
        ...getFunctionalParamsFromNode(node),
      ]);
    },
  });

  // Remove declared variables and function params
  variableDeclarations.forEach((variable) => identifiers.delete(variable));
  functionalParams.forEach((param) => identifiers.delete(param.paramName));

  return Array.from(identifiers);
};

type functionParams = { paramName: string; defaultValue: unknown };

const getFunctionalParamsFromNode = (
  node:
    | FunctionDeclarationNode
    | FunctionExpressionNode
    | ArrowFunctionExpressionNode,
  needValue = false,
): Set<functionParams> => {
  const functionalParams = new Set<functionParams>();
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
  child = "",
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

type JsObjectProperty = {
  key: string;
  value: string;
  type: string;
  arguments?: Array<functionParams>;
};

export const parseJSObjectWithAST = (
  jsObjectBody: string,
): Array<JsObjectProperty> => {
  /* 
    jsObjectVariableName value is added such actual js code would never name same variable name. 
    if the variable name will be same then also we won't have problem here as jsObjectVariableName will be last node in VariableDeclarator hence overriding the previous JSObjectProperties.
    Keeping this just for sanity check if any caveat was missed.
  */
  const jsObjectVariableName =
    "____INTERNAL_JS_OBJECT_NAME_USED_FOR_PARSING_____";
  const jsCode = `var ${jsObjectVariableName} = ${jsObjectBody}`;

  const ast = parse(jsCode, { ecmaVersion: ECMA_VERSION });

  const parsedObjectProperties = new Set<JsObjectProperty>();
  let JSObjectProperties: Array<PropertyNode> = [];

  simple(ast, {
    VariableDeclarator(node: Node) {
      if (
        isVariableDeclarator(node) &&
        node.id.name === jsObjectVariableName &&
        node.init &&
        isObjectExpression(node.init)
      ) {
        JSObjectProperties = node.init.properties;
      }
    },
  });
  JSObjectProperties.forEach((node) => {
    let params = new Set<functionParams>();
    const propertyNode = node;
    let property: JsObjectProperty = {
      key: generate(propertyNode.key),
      value: generate(propertyNode.value),
      type: propertyNode.value.type,
    };

    if (isPropertyAFunctionNode(propertyNode.value)) {
      // if in future we need default values of each param, we could implement that in getFunctionalParamsFromNode
      // currently we don't consume it anywhere hence avoiding to calculate that.
      params = getFunctionalParamsFromNode(propertyNode.value);
      property = {
        ...property,
        arguments: [...params],
      };
    }

    // here we use `generate` function to convert our AST Node to JSCode
    parsedObjectProperties.add(property);
  });

  return [...parsedObjectProperties];
};

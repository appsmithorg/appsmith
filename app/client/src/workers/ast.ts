import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import _ from "lodash";
import { ECMA_VERSION } from "workers/constants";
import { sanitizeScript } from "./evaluate";

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

// Each node has an attached type property which further defines
// what all properties can the node have.
// We will just define the ones we are working with
enum NodeTypes {
  MemberExpression = "MemberExpression",
  Identifier = "Identifier",
  VariableDeclarator = "VariableDeclarator",
  FunctionDeclaration = "FunctionDeclaration",
  FunctionExpression = "FunctionExpression",
  AssignmentPattern = "AssignmentPattern",
  Literal = "Literal",
}

type Pattern = IdentifierNode | AssignmentPatternNode;

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
interface FunctionExpressionNode extends Node, Function {
  type: NodeTypes.FunctionExpression;
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

/* We need these functions to typescript casts the nodes with the correct types */
const isIdentifierNode = (node: Node): node is IdentifierNode => {
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

const isAssignmentPatternNode = (node: Node): node is AssignmentPatternNode => {
  return node.type === NodeTypes.AssignmentPattern;
};

const isLiteralNode = (node: Node): node is LiteralNode => {
  return node.type === NodeTypes.Literal;
};

const isArrayAccessorNode = (node: Node): node is MemberExpressionNode => {
  return (
    isMemberExpressionNode(node) &&
    node.computed &&
    isLiteralNode(node.property) &&
    _.isFinite(node.property.value)
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
  let functionalParams = new Set<string>();
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
  functionalParams.forEach((param) => identifiers.delete(param));

  return Array.from(identifiers);
};

const getFunctionalParamsFromNode = (
  node: FunctionDeclarationNode | FunctionExpressionNode,
): Set<string> => {
  const functionalParams = new Set<string>();
  node.params.forEach((paramNode) => {
    if (isIdentifierNode(paramNode)) {
      functionalParams.add(paramNode.name);
    } else if (isAssignmentPatternNode(paramNode)) {
      if (isIdentifierNode(paramNode.left)) {
        functionalParams.add(paramNode.left.name);
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
  } else if (isLiteralNode(propertyNode) && _.isString(propertyNode.value)) {
    // is string literal search a['b']
    return `.${propertyNode.value}`;
  } else if (isLiteralNode(propertyNode) && _.isFinite(propertyNode.value)) {
    // is array index search - a[9]
    return `[${propertyNode.value}]`;
  }
};

import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";
import { isString } from "lodash";
import { ECMA_VERSION } from "workers/constants";

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
interface FunctionDeclarationNode extends Node {
  type: NodeTypes.FunctionDeclaration;
  id: IdentifierNode;
  params: Pattern[];
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

const isAssignmentPatternNode = (node: Node): node is AssignmentPatternNode => {
  return node.type === NodeTypes.AssignmentPattern;
};

const isLiteralNode = (node: Node): node is LiteralNode => {
  return node.type === NodeTypes.Literal;
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
  const functionalParams = new Set<string>();
  let ast: Node = { end: 0, start: 0, type: "" };
  try {
    ast = getAST(code);
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
      let depth = ancestors.length - 1;
      while (depth > 0) {
        const parent = ancestors[depth - 1];
        if (
          isMemberExpressionNode(parent) &&
          // We will ignore member expressions that are "computed" (with index [ ]  search)
          // and the ones that have optional chaining ( a.b?.c ).
          // We will stop looking for further parents and consider this node to be top level
          !parent.computed &&
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
      // params in functions are also counted as identifiers so we keep
      // track of them as well and remove them from the final list of identifiers
      if (isFunctionDeclaration(node)) {
        node.params.forEach((paramNode) => {
          if (isIdentifierNode(paramNode)) {
            functionalParams.add(paramNode.name);
          } else if (isAssignmentPatternNode(paramNode)) {
            if (isIdentifierNode(paramNode.left)) {
              functionalParams.add(paramNode.left.name);
            }
          }
        });
      }
    },
  });

  // Remove declared variables and function params
  variableDeclarations.forEach((variable) => identifiers.delete(variable));
  functionalParams.forEach((param) => identifiers.delete(param));

  return Array.from(identifiers);
};

const constructFinalMemberExpIdentifier = (
  node: MemberExpressionNode,
  child = "",
): string => {
  if (isIdentifierNode(node.object)) {
    const propertyName = getPropertyName(node);
    return `${node.object.name}.${propertyName}${child ? "." + child : ""}`;
  } else {
    const propertyName = getPropertyName(node);
    const nestedChild = `${propertyName}${child ? "." + child : ""}`;
    return constructFinalMemberExpIdentifier(node.object, nestedChild);
  }
};

const getPropertyName = (node: MemberExpressionNode) => {
  let propertyName = "";
  if (isIdentifierNode(node.property)) {
    propertyName = node.property.name;
  }
  if (isLiteralNode(node.property)) {
    if (isString(node.property.value)) {
      propertyName = node.property.value;
    }
  }
  return propertyName;
};

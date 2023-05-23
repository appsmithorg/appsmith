import type { Node } from "acorn";
import type {
  BinaryExpressionNode,
  CallExpressionNode,
  ConditionalExpressionNode,
  ExpressionStatement,
  IdentifierNode,
  MemberExpressionNode,
} from "../index";
import { isAwaitExpressionNode } from "../index";
import { isBinaryExpressionNode } from "../index";
import { isConditionalExpressionNode } from "../index";
import {
  isCallExpressionNode,
  isExpressionStatementNode,
  isIdentifierNode,
  isMemberExpressionNode,
  isThisExpressionNode,
} from "../index";
import * as escodegen from "escodegen";
import { NodeTypes } from "../constants/ast";
import type { PeekOverlayExpressionIdentifierOptions } from "./index";

export const isPositionWithinNode = (node: Node, pos: number) =>
  pos >= node.start && pos <= node.end;

export const getExpressionStringAtPos = (
  node: Node,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  if (!isPositionWithinNode(node, pos)) return;
  if (isMemberExpressionNode(node)) {
    return getExpressionAtPosFromMemberExpression(node, pos, options);
  } else if (isExpressionStatementNode(node)) {
    return getExpressionAtPosFromExpressionStatement(node, pos, options);
  } else if (isCallExpressionNode(node)) {
    return getExpressionAtPosFromCallExpression(node, pos, options);
  } else if (isBinaryExpressionNode(node)) {
    return getExpressionAtPosFromBinaryExpression(node, pos, options);
  } else if (isIdentifierNode(node)) {
    return escodegen.generate(node);
  }
};

const getExpressionAtPosFromMemberExpression = (
  node: MemberExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
  replaceThisExpression = true,
): string | undefined => {
  const objectNode = node.object;
  if (isLocalVariableNode(node) || isLocalVariableNode(objectNode)) return;
  if (replaceThisExpression && options?.thisExpressionReplacement) {
    node = replaceThisinMemberExpression(node, options);
  }
  // position is within the object node
  if (pos <= objectNode.end) {
    if (isMemberExpressionNode(objectNode)) {
      return getExpressionAtPosFromMemberExpression(objectNode, pos, options);
    } else if (isCallExpressionNode(objectNode)) {
      return getExpressionAtPosFromCallExpression(objectNode, pos, options);
    }
    return escodegen.generate(objectNode);
  }
  // position is within the property node
  else {
    const propertyNode = node.property;
    if (isMemberExpressionNode(propertyNode)) {
      return getExpressionAtPosFromMemberExpression(propertyNode, pos);
    }
    return escodegen.generate(node);
  }
};

const getExpressionAtPosFromExpressionStatement = (
  node: ExpressionStatement,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  if (
    isThisExpressionNode(node.expression) &&
    options?.thisExpressionReplacement
  ) {
    node.expression = thisReplacementNode(node.expression, options);
  }
  const expressionNode = node.expression;
  if (isMemberExpressionNode(expressionNode)) {
    return getExpressionAtPosFromMemberExpression(expressionNode, pos, options);
  } else if (isAwaitExpressionNode(expressionNode)) {
    return getExpressionStringAtPos(expressionNode.argument, pos, options);
  } else if (isConditionalExpressionNode(expressionNode)) {
    return getExpressionAtPosFromConditionalExpression(
      expressionNode,
      pos,
      options,
    );
  } else if (isCallExpressionNode(expressionNode)) {
    return getExpressionAtPosFromCallExpression(expressionNode, pos, options);
  } else {
    // remove ; from expression statement
    console.log(node);
    return stringRemoveLastCharacter(escodegen.generate(node));
  }
};

const getExpressionAtPosFromCallExpression = (
  node: CallExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  let selectedNode: Node | undefined;
  if (isPositionWithinNode(node.callee, pos)) {
    selectedNode = node.callee;
  } else if (node.arguments.length > 0) {
    const argumentNode = node.arguments.find((node) =>
      isPositionWithinNode(node, pos),
    );
    if (argumentNode) {
      selectedNode = argumentNode;
    }
  }
  return selectedNode && getExpressionStringAtPos(selectedNode, pos, options);
};

const getExpressionAtPosFromConditionalExpression = (
  node: ConditionalExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  let selectedNode: Node | undefined;
  if (isPositionWithinNode(node.test, pos)) {
    selectedNode = node.test;
  } else if (isPositionWithinNode(node.consequent, pos)) {
    selectedNode = node.consequent;
  } else if (isPositionWithinNode(node.alternate, pos)) {
    selectedNode = node.alternate;
  }
  return selectedNode && getExpressionStringAtPos(selectedNode, pos, options);
};

const getExpressionAtPosFromBinaryExpression = (
  node: BinaryExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  let selectedNode: Node | undefined;
  if (isPositionWithinNode(node.left, pos)) {
    selectedNode = node.left;
  } else if (isPositionWithinNode(node.right, pos)) {
    selectedNode = node.right;
  }
  return selectedNode && getExpressionStringAtPos(selectedNode, pos, options);
};

export const replaceThisinMemberExpression = (
  node: MemberExpressionNode,
  options: PeekOverlayExpressionIdentifierOptions,
): MemberExpressionNode => {
  if (isMemberExpressionNode(node.object)) {
    node.object = replaceThisinMemberExpression(node.object, options);
  } else if (isThisExpressionNode(node.object)) {
    node.object = thisReplacementNode(node.object, options);
  }
  return node;
};

// replace "this" node with the provided replacement
const thisReplacementNode = (
  node: Node,
  options: PeekOverlayExpressionIdentifierOptions,
) => {
  return {
    ...node,
    type: NodeTypes.Identifier,
    name: options.thisExpressionReplacement,
  } as IdentifierNode;
};

const stringRemoveLastCharacter = (value: string) =>
  value.slice(0, value.length - 1);

const isLocalVariableNode = (node: Node) =>
  isMemberExpressionNode(node) &&
  node.computed &&
  isIdentifierNode(node.property);

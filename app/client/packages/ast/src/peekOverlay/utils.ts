import type { Node } from "acorn";
import type {
  BinaryExpressionNode,
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
  }
};

const getExpressionAtPosFromMemberExpression = (
  node: MemberExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  if (options?.thisExpressionReplacement) {
    node = replaceThisinMemberExpression(node, options);
  }
  const objectNode = node.object;
  // position is within the object node
  if (pos <= objectNode.end) {
    if (isMemberExpressionNode(objectNode)) {
      return getExpressionAtPosFromMemberExpression(objectNode, pos, options);
    }
    return escodegen.generate(objectNode);
  }
  // position is within the property node
  else {
    // return undefined if object node has any local variable
    if (isLocalVariableNode(objectNode)) return;
    const propertyNode = node.property;
    if (isMemberExpressionNode(propertyNode)) {
      return getExpressionAtPosFromMemberExpression(propertyNode, pos);
    } else if (!isLocalVariableNode(node)) {
      // return only when property node has no local variable
      return escodegen.generate(node);
    }
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
  } else if (!isCallExpressionNode(expressionNode)) {
    // remove ; from expression statement
    return stringRemoveLastCharacter(escodegen.generate(node));
  }
};

const getExpressionAtPosFromConditionalExpression = (
  node: ConditionalExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  if (isPositionWithinNode(node.test, pos)) {
    if (isBinaryExpressionNode(node.test)) {
      return getExpressionAtPosFromBinaryExpression(node.test, pos, options);
    } else {
      return getExpressionStringAtPos(node.test, pos, options);
    }
  } else if (isPositionWithinNode(node.consequent, pos)) {
    return getExpressionStringAtPos(node.consequent, pos, options);
  } else if (isPositionWithinNode(node.alternate, pos)) {
    return getExpressionStringAtPos(node.alternate, pos, options);
  }
};

const getExpressionAtPosFromBinaryExpression = (
  node: BinaryExpressionNode,
  pos: number,
  options?: PeekOverlayExpressionIdentifierOptions,
): string | undefined => {
  if (isPositionWithinNode(node.left, pos)) {
    return getExpressionStringAtPos(node.left, pos, options);
  } else if (isPositionWithinNode(node.right, pos)) {
    return getExpressionStringAtPos(node.right, pos, options);
  }
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

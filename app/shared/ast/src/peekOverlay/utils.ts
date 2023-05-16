import { Node } from "acorn";
import { ExpressionStatement, IdentifierNode, MemberExpressionNode, isExpressionStatementNode, isMemberExpressionNode, isThisExpressionNode } from "../index";
import { PeekOverlayExpressionIdentifierOptions } from "peekOverlay";
import * as escodegen from "escodegen";
import { NodeTypes } from "../constants/ast";

export const isPositionWithinNode = (node: Node, pos: number) => pos >= node.start && pos <= node.end;

export const getExpressionStringAtPos = 
    (
        node: Node,
        pos: number,
        options?: PeekOverlayExpressionIdentifierOptions
    ): string => {
        if (!isPositionWithinNode(node, pos)) return "";
        if (isMemberExpressionNode(node)) {
            return getExpressionAtPosFromMemberExpression(node, pos, options);
        }
        else if (isExpressionStatementNode(node)) {
            return getExpressionAtPosFromExpressionStatement(node, pos, options);
        }
        return "";
    };

const getExpressionAtPosFromMemberExpression = 
    (
        node: MemberExpressionNode, 
        pos: number, 
        options?: PeekOverlayExpressionIdentifierOptions
    ): string => {
        if (!isPositionWithinNode(node, pos)) return "";
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
            const propertyNode = node.property;
            return isMemberExpressionNode(propertyNode) ? 
                getExpressionAtPosFromMemberExpression(propertyNode, pos)
                : escodegen.generate(node)
        }
    }

const getExpressionAtPosFromExpressionStatement = 
    (
        node: ExpressionStatement, 
        pos: number, 
        options?: PeekOverlayExpressionIdentifierOptions
    ): string => {
        if (!isPositionWithinNode(node, pos)) return "";
        if (isThisExpressionNode(node.expression) && options?.thisExpressionReplacement) {
            node.expression = thisReplacementNode(node.expression, options);
        }
        const expressionNode = node.expression;
        if (isMemberExpressionNode(expressionNode)) {
            return getExpressionAtPosFromMemberExpression(expressionNode, pos, options);
        }
        // remove ; from expression statement
        return stringRemoveLastCharacter(escodegen.generate(node))
    }


export const replaceThisinMemberExpression = (
    node: MemberExpressionNode, 
    options: PeekOverlayExpressionIdentifierOptions
): MemberExpressionNode => {
    if (isMemberExpressionNode(node.object)) {
        node.object = replaceThisinMemberExpression(node.object, options);
    } else if (isThisExpressionNode(node.object)) {
        node.object = thisReplacementNode(node.object, options);
    }
    return node;
}

// replace "this" node with the provided replacement
const thisReplacementNode = (node: Node, options: PeekOverlayExpressionIdentifierOptions) => {
    return {
        ...node,
        type: NodeTypes.Identifier,
        name: options.thisExpressionReplacement,
    } as IdentifierNode;
};

const stringRemoveLastCharacter = (value: string) => value.slice(0, value.length - 1);
  
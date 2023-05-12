import {parse, Node} from "acorn";
import * as escodegen from "escodegen";
import { simple } from "acorn-walk";
import { ExpressionStatement, IdentifierNode, MemberExpressionNode, ThisExpressionNode, isExpressionStatementNode, isMemberExpressionNode, isThisExpressionNode } from "../index";
import { NodeTypes, SourceType } from "../constants/ast";

export type ExtractExpressionAtPositionOptions = {
    thisExpressionReplacement?: string;
}

export const extractExpressionAtPosition = 
    (
        script: string, 
        pos: number, 
        sourceType = SourceType.script, 
        options?: ExtractExpressionAtPositionOptions,
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const ast = parse(script, { ecmaVersion: 11, sourceType });

            let nodeFound: Node | undefined;

            simple(ast, {
                MemberExpression(node: Node) {
                    if (!nodeFound && isPositionWithinNode(node, pos)) {
                        nodeFound = node;
                    }
                },
                ExpressionStatement(node: Node) {
                    if (!nodeFound && isPositionWithinNode(node, pos)) {
                        nodeFound = node;
                    }
                },
            });

            nodeFound ? 
                resolve(getExpressionStringAtPos(nodeFound, pos, options)) 
                : reject("no node found");
        });
    };

const getExpressionStringAtPos = 
    (
        node: Node,
        pos: number,
        options?: ExtractExpressionAtPositionOptions
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
        options?: ExtractExpressionAtPositionOptions
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
        options?: ExtractExpressionAtPositionOptions
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


const replaceThisinMemberExpression = (
    node: MemberExpressionNode, 
    options: ExtractExpressionAtPositionOptions
): MemberExpressionNode => {
    if (isMemberExpressionNode(node.object)) {
        node.object = replaceThisinMemberExpression(node.object, options);
    } else if (isThisExpressionNode(node.object)) {
        node.object = thisReplacementNode(node.object, options);
    }
    return node;
}

// replace "this" node with the provided replacement
const thisReplacementNode = (node: Node, options: ExtractExpressionAtPositionOptions) => {
    return {
        ...node,
        type: NodeTypes.Identifier,
        name: options.thisExpressionReplacement,
    } as IdentifierNode;
};

const isPositionWithinNode = (node: Node, pos: number) => pos >= node.start && pos <= node.end;

const stringRemoveLastCharacter = (value: string) => value.slice(0, value.length - 1);
  

import { getAST, isCallExpressionNode } from "../index";
import { sanitizeScript } from "../utils";
import { simple } from "acorn-walk";
import { Node } from "acorn";
import { NodeTypes } from "../constants";
import { generate } from "astring";

const wrapCode = (code: string) => {
    return `
    (function() {
      return ${code}
    })
  `;
};

export const getTextArgumentAtPosition = (value: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = "";
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = getAST(wrappedCode);
    } catch (error) {
        return requiredArgument;
    }

    simple(ast, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                let argument = node.arguments[argNum];
                switch (argument.type){
                    case NodeTypes.ObjectExpression:
                        requiredArgument = "{{{}}}";
                        break;
                    case NodeTypes.ArrowFunctionExpression:
                        requiredArgument = `{{${generate(argument)}}}`;
                        break;
                    case NodeTypes.Literal:
                        requiredArgument = argument.value as string;
                }
            }
        },
    });

    return requiredArgument;
}

export const getEnumArgumentAtPosition = (value: string, argNum: number, defaultValue: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = defaultValue;
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = getAST(wrappedCode);
    } catch (error) {
        return defaultValue;
    }

    simple(ast, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                let argument = node.arguments[argNum];
                switch (argument.type) {
                    case NodeTypes.Literal:
                        requiredArgument = argument.raw as string;
                }
            }
        },
    });

    return requiredArgument;
}

export const getModalName = (value: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let modalName: string = "none";
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = getAST(wrappedCode);
    } catch (error) {
        return modalName;
    }

    simple(ast, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                let argument = node.arguments[0];
                switch (argument.type){
                    case NodeTypes.Literal:
                        modalName = argument.value as string;
                }
            }
        },
    });

    return modalName;
}

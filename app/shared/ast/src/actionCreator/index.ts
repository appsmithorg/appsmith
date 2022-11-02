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

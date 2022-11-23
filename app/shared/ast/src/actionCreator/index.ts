import {
    ArrowFunctionExpressionNode,
    isArrowFunctionExpression,
    isCallExpressionNode,
    LiteralNode
} from "../index";
import {sanitizeScript} from "../utils";
import {simple} from "acorn-walk";
import {Node, parse, Comment} from "acorn";
import {ECMA_VERSION, NodeTypes} from "../constants";
import {generate} from "astring";
import {attachComments} from "astravel";

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
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = parse(wrappedCode, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                let argument = node.arguments[argNum];
                switch (argument.type) {
                    case NodeTypes.ObjectExpression:
                        requiredArgument = "{{{}}}";
                        break;
                    case NodeTypes.Literal:
                        requiredArgument = argument.value as string;
                }
            }
        },
    });

    return requiredArgument;
}

export const setTextArgumentAtPosition = (currentValue: string, changeValue: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changedValue: string = currentValue;
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        ast = parse(sanitizedScript, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return changedValue;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                const startPosition = node.callee.end + 1;
                node.arguments[argNum] = {
                    type: NodeTypes.Literal,
                    value: `'${changeValue}'`,
                    raw: String.raw`'${changeValue}'`,
                    start: startPosition,
                    // add 2 for quotes
                    end: (startPosition) + (changeValue.length + 2),
                };
                changedValue = `{{${generate(astWithComments, {comments: true}).trim()}}}`;
            }
        },
    });

    return changedValue;
}

export const setCallbackFunctionField = (currentValue: string, changeValue: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changeValueAst: Node = { end: 0, start: 0, type: "" };
    let changedValue: string = currentValue;
    let changedValueCommentArray: Array<Comment> = [];
    let currentValueCommentArray: Array<Comment> = [];
    let requiredNode: ArrowFunctionExpressionNode = {
        end: 0,
        start: 0,
        type: NodeTypes.ArrowFunctionExpression,
        params: [],
        id: null,
    };
    try {
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        ast = parse(sanitizedScript, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: currentValueCommentArray,
        });

        const sanitizedChangeValue = sanitizeScript(changeValue, evaluationVersion);
        changeValueAst = parse(sanitizedChangeValue, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: changedValueCommentArray,
        });
    } catch (error) {
        return changedValue;
    }
    const changeValueAstWithComments = attachComments(changeValueAst, changedValueCommentArray);
    const currentValueAstWithComments = attachComments(ast, currentValueCommentArray);

    simple(changeValueAstWithComments, {
        ArrowFunctionExpression(node) {
            if (isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        }
    });

    simple(currentValueAstWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                requiredNode.start = node.arguments[0].start;
                requiredNode.end = node.arguments[0].start + changedValue.length;
                node.arguments[argNum] = requiredNode;
                changedValue = `${generate(currentValueAstWithComments, {comments: true}).trim()}`;
            }
        },
    });

    return changedValue;
}

export const getEnumArgumentAtPosition = (value: string, argNum: number, defaultValue: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = defaultValue;
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = parse(wrappedCode, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return defaultValue;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
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

export const setEnumArgumentAtPosition = (currentValue: string, changeValue: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changedValue: string = currentValue;
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        ast = parse(sanitizedScript, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return changedValue;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                const startPosition = node.callee.end + 1;
                node.arguments[argNum] = {
                    type: NodeTypes.Literal,
                    value: `${changeValue}`,
                    raw: String.raw`${changeValue}`,
                    start: startPosition,
                    // add 2 for quotes
                    end: (startPosition) + (changeValue.length + 2),
                };
                changedValue = `{{${generate(astWithComments, {comments: true}).trim()}}}`;
            }
        },
    });

    return changedValue;
}

export const getModalName = (value: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let modalName: string = "none";
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = parse(wrappedCode, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return modalName;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
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

export const setModalName = (currentValue: string, changeValue: string, evaluationVersion: number) => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changedValue: string = currentValue;
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        ast = parse(sanitizedScript, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return changedValue;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                const startPosition = node.callee.end + 1;
                const newNode: LiteralNode = {
                    type: NodeTypes.Literal,
                    value: `${changeValue}`,
                    raw: String.raw`'${changeValue}'`,
                    start: startPosition,
                    // add 2 for quotes
                    end: startPosition + (changeValue.length + 2),
                };
                node.arguments = [newNode];
                changedValue = `{{${generate(astWithComments, {comments: true}).trim()}}}`;
            }
        },
    });

    return changedValue;
}

export const getFuncExpressionAtPosition = (value: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = "() => {}";
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = parse(wrappedCode, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments.length > 0) {
                let argument = node.arguments[argNum];
                if (argument) {
                    requiredArgument = `${generate(argument, {comments: true})}`;
                }
            }
        },
    });
    return requiredArgument;
}

export const getFunction = (value: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredFunction: string = "";
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = parse(wrappedCode, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredFunction;
    }
    const astWithComments = attachComments(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                const func = `${generate(node)}`;
                requiredFunction = func !== '{}' ? `{{${func}}}` : "";
            }
        },
    });

    return requiredFunction;
}

export const replaceActionInQuery = (query: string, changeAction: string, argNum: number, evaluationVersion: number) => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changeActionAst: Node = { end: 0, start: 0, type: "" };
    let requiredNode: ArrowFunctionExpressionNode = {
        end: 0,
        start: 0,
        type: NodeTypes.ArrowFunctionExpression,
        params: [],
        id: null,
    };
    let requiredQuery: string = "";
    let commentArray: Array<Comment> = [];
    let changeActionCommentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(query, evaluationVersion);
        ast = parse(sanitizedScript, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: commentArray,
        });

        const sanitizedChangeAction = sanitizeScript(changeAction, evaluationVersion);
        changeActionAst = parse(sanitizedChangeAction, {
            locations: true,
            ranges: true,
            ecmaVersion: ECMA_VERSION,
            onComment: changeActionCommentArray,
        });
    } catch (error) {
        return requiredQuery;
    }
    const astWithComments = attachComments(ast, commentArray);
    const changeActionAstWithComments = attachComments(changeActionAst, changeActionCommentArray);


    simple(changeActionAstWithComments, {
        ArrowFunctionExpression(node) {
            if (isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        }
    });


    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && isCallExpressionNode(node.callee)) {
                const startPosition = node.callee.end + 1;
                requiredNode.start = startPosition;
                requiredNode.end = startPosition + changeAction.length;
                node.callee.arguments[argNum] = requiredNode;
                requiredQuery = `${generate(astWithComments, {comments: true}).trim()}`
            }
        },
    });

    return requiredQuery;
}

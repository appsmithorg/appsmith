import {
    ArrowFunctionExpressionNode, getAST,
    getAstWithCommentsAttached,
    isArrowFunctionExpression,
    isCallExpressionNode,
    LiteralNode,
    wrapCode,
} from "../index";
import {sanitizeScript} from "../utils";
import {simple} from "acorn-walk";
import {Node, Comment} from "acorn";
import {NodeTypes} from "../constants";
import {generate} from "astring";
import {klona} from "klona/json";

const LENGTH_OF_QUOTES = 2;
const NEXT_POSITION = 1;

export const getTextArgumentAtPosition = (value: string, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = "";
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        const __ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments[argNum]) {
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
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return changedValue;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.callee.end + NEXT_POSITION;
                node.arguments[argNum] = {
                    type: NodeTypes.Literal,
                    value: `${changeValue}`,
                    raw: String.raw`'${changeValue}'`,
                    start: startPosition,
                    // add 2 for quotes
                    end: (startPosition) + (changeValue.length + LENGTH_OF_QUOTES),
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
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: currentValueCommentArray,
        });
        ast = klona(__ast);

        const sanitizedChangeValue = sanitizeScript(changeValue, evaluationVersion);
        const __changeValueAst = getAST(sanitizedChangeValue, {
            locations: true,
            ranges: true,
            onComment: changedValueCommentArray,
        });
        changeValueAst = klona(__changeValueAst);
    } catch (error) {
        return changedValue;
    }
    const changeValueAstWithComments = getAstWithCommentsAttached(changeValueAst, changedValueCommentArray);
    const currentValueAstWithComments = getAstWithCommentsAttached(ast, currentValueCommentArray);

    simple(changeValueAstWithComments, {
        ArrowFunctionExpression(node) {
            if (isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        }
    });

    simple(currentValueAstWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments[argNum]) {
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
        const __ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return defaultValue;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments[argNum]) {
                if (node.arguments[argNum]) {
                    let argument = node.arguments[argNum];
                    switch (argument.type) {
                        case NodeTypes.Literal:
                            requiredArgument = argument.raw as string;
                    }
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
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return changedValue;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.callee.end + NEXT_POSITION;
                node.arguments[argNum] = {
                    type: NodeTypes.Literal,
                    value: `${changeValue}`,
                    raw: String.raw`${changeValue}`,
                    start: startPosition,
                    // add 2 for quotes
                    end: (startPosition) + (changeValue.length + LENGTH_OF_QUOTES),
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
        const __ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return modalName;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

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
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return changedValue;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.callee.end + NEXT_POSITION;
                const newNode: LiteralNode = {
                    type: NodeTypes.Literal,
                    value: `${changeValue}`,
                    raw: String.raw`'${changeValue}'`,
                    start: startPosition,
                    // add 2 for quotes
                    end: startPosition + (changeValue.length + LENGTH_OF_QUOTES),
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
        const __ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments[argNum]) {
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
        const __ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        return requiredFunction;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);

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
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);

        const sanitizedChangeAction = sanitizeScript(changeAction, evaluationVersion);
        const __changeActionAst = getAST(sanitizedChangeAction, {
            locations: true,
            ranges: true,
            onComment: changeActionCommentArray,
        });
        changeActionAst = klona(__changeActionAst);
    } catch (error) {
        return requiredQuery;
    }
    const astWithComments = getAstWithCommentsAttached(ast, commentArray);
    const changeActionAstWithComments = getAstWithCommentsAttached(changeActionAst, changeActionCommentArray);


    simple(changeActionAstWithComments, {
        ArrowFunctionExpression(node) {
            if (isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        }
    });


    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && isCallExpressionNode(node.callee) && node.arguments[argNum]) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.callee.end + NEXT_POSITION;
                requiredNode.start = startPosition;
                requiredNode.end = startPosition + changeAction.length;
                node.callee.arguments[argNum] = requiredNode;
                requiredQuery = `${generate(astWithComments, {comments: true}).trim()}`
            }
        },
    });

    return requiredQuery;
}

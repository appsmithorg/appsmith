import {
    ArrowFunctionExpressionNode, getAST,
    attachCommentsToAst,
    isArrowFunctionExpression,
    MemberExpressionNode,
    isCallExpressionNode,
    isMemberExpressionNode,
    LiteralNode,
    wrapCode, CallExpressionNode,
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
    let requiredArgument: any = "";
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && node.arguments[argNum]) {
                let argument = node.arguments[argNum];
                switch (argument.type) {
                    case NodeTypes.ObjectExpression:
                        requiredArgument = "{{{}}}";
                        break;
                    case NodeTypes.Literal:
                        requiredArgument = typeof argument.value === "string" ? argument.value : `{{${argument.value}}}`;
                        break;
                    case NodeTypes.MemberExpression:
                        // this is for cases where we have {{appsmith.mode}} or {{Jsobj1.mytext}}
                        requiredArgument = `{{${generate(argument, {comments: true}).trim()}}}`;
                        break;
                    case NodeTypes.ArrowFunctionExpression:
                    case NodeTypes.CallExpression:
                        if (value.indexOf(".then") === -1) {
                            // this is for cases where we need to extract functions with no .then
                            requiredArgument = argument;
                        } else {
                            // this is for cases with a .then in the value
                            const requiredArg = ((node.callee as MemberExpressionNode).object as CallExpressionNode).arguments[argNum];
                            requiredArgument = (requiredArg as LiteralNode).value;
                        }
                        break;
                }
            }
        },
    });

    return requiredArgument;
}

export const setTextArgumentAtPosition = (currentValue: string, changeValue: any, argNum: number, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let changedValue: string = currentValue;
    let commentArray: Array<Comment> = [];
    const rawValue = typeof changeValue === "string" ? String.raw`"${changeValue}"` : String.raw`${changeValue}`;
    try {
        const changeValueScript = sanitizeScript(rawValue, evaluationVersion);
        const changeValueAst = getAST(changeValueScript, {
            locations: true,
            ranges: true,
        });
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        const __ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
        ast = klona(__ast);
    } catch (error) {
        throw error;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node)) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.callee.end + NEXT_POSITION;
                node.arguments[argNum] = {
                    type: NodeTypes.Literal,
                    value: changeValue,
                    raw: rawValue,
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
    let requiredNode: ArrowFunctionExpressionNode | MemberExpressionNode;
    try {
        const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
        ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: currentValueCommentArray,
        });

        const sanitizedChangeValue = sanitizeScript(changeValue, evaluationVersion);
        changeValueAst = getAST(sanitizedChangeValue, {
            locations: true,
            ranges: true,
            onComment: changedValueCommentArray,
        });
    } catch (error) {
        throw error;
    }
    const changeValueAstWithComments = klona(attachCommentsToAst(changeValueAst, changedValueCommentArray));
    const currentValueAstWithComments = klona(attachCommentsToAst(ast, currentValueCommentArray));

    simple(changeValueAstWithComments, {
        ArrowFunctionExpression(node) {
            if(isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        },
        MemberExpression(node) {
            if (isMemberExpressionNode(node)) {
                requiredNode = node;
            }
        },
    });

    // @ts-ignore
    if(!!requiredNode) {
        simple(currentValueAstWithComments, {
            CallExpression(node) {
                if (isCallExpressionNode(node) && node.arguments[argNum]) {
                    requiredNode.start = node.arguments[0].start;
                    requiredNode.end = node.arguments[0].start + changedValue.length;
                    // @ts-ignore
                    node.arguments[argNum] = requiredNode;
                    changedValue = `{{${generate(currentValueAstWithComments, {comments: true}).trim()}}}`;
                }
            },
        });

    }

    return changedValue;
}

export const getEnumArgumentAtPosition = (value: string, argNum: number, defaultValue: string, evaluationVersion: number): string => {
    let ast: Node = { end: 0, start: 0, type: "" };
    let requiredArgument: string = defaultValue;
    let commentArray: Array<Comment> = [];
    try {
        const sanitizedScript = sanitizeScript(value, evaluationVersion);
        const wrappedCode = wrapCode(sanitizedScript);
        ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
    } catch (error) {
        return defaultValue;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        throw error;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
    } catch (error) {
        return modalName;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        throw error;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredArgument;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        ast = getAST(wrappedCode, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });
    } catch (error) {
        return requiredFunction;
    }
    const astWithComments = attachCommentsToAst(ast, commentArray);

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
        ast = getAST(sanitizedScript, {
            locations: true,
            ranges: true,
            onComment: commentArray,
        });

        const sanitizedChangeAction = sanitizeScript(changeAction, evaluationVersion);
        changeActionAst = getAST(sanitizedChangeAction, {
            locations: true,
            ranges: true,
            onComment: changeActionCommentArray,
        });
    } catch (error) {
        throw error;
    }
    const astWithComments = klona(attachCommentsToAst(ast, commentArray));
    const changeActionAstWithComments = klona(attachCommentsToAst(changeActionAst, changeActionCommentArray));


    simple(changeActionAstWithComments, {
        ArrowFunctionExpression(node) {
            if (isArrowFunctionExpression(node)) {
                requiredNode = node;
            }
        }
    });

    simple(astWithComments, {
        CallExpression(node) {
            if (isCallExpressionNode(node) && isMemberExpressionNode(node.callee) && node.arguments[argNum]) {
                // add 1 to get the starting position of the next
                // node to ending position of previous
                const startPosition = node.arguments[argNum].start;
                requiredNode.start = startPosition;
                requiredNode.end = startPosition + changeAction.length;
                node.arguments[argNum] = requiredNode;
                requiredQuery = `${generate(astWithComments, {comments: true}).trim()}`
            }
        },
    });

    return requiredQuery;
}

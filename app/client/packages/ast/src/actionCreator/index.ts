import type {
  ArrowFunctionExpressionNode,
  MemberExpressionNode,
  LiteralNode,
  CallExpressionNode,
  BinaryExpressionNode,
  BlockStatementNode,
  ArgumentTypes,
} from "../index";
import {
  getAST,
  attachCommentsToAst,
  isArrowFunctionExpression,
  isCallExpressionNode,
  isMemberExpressionNode,
  wrapCode,
  isIdentifierNode,
  isExpressionStatementNode,
  isTypeOfFunction,
  isBlockStatementNode,
} from "../index";
import { sanitizeScript } from "../utils";
import { findNodeAt, simple } from "acorn-walk";
import type { Node, Comment } from "acorn";
import { NodeTypes } from "../constants";
import { generate } from "astring";
import { klona } from "klona/json";

const LENGTH_OF_QUOTES = 2;
const NEXT_POSITION = 1;

export const getTextArgumentAtPosition = (
  value: string,
  argNum: number,
  evaluationVersion: number,
): string => {
  // Takes a function string and returns the text argument at argNum position
  let ast: Node = { end: 0, start: 0, type: "" };
  let requiredArgument: any = "";
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(value, evaluationVersion);
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid return a blank string
    return requiredArgument;
  }

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    const argument = node.arguments[argNum];

    // return appropriate values based on the type of node
    switch (argument?.type) {
      case NodeTypes.Identifier:
      case NodeTypes.ObjectExpression:
        // this is for objects
        requiredArgument = `{{${generate(argument, {
          comments: true,
        }).trim()}}}`;
        break;
      case NodeTypes.Literal:
        requiredArgument =
          typeof argument.value === "string"
            ? argument.value
            : `{{${argument.value}}}`;
        break;
      case NodeTypes.MemberExpression:
        // this is for cases where we have {{appsmith.mode}} or {{Jsobj1.mytext}}
        requiredArgument = `{{${generate(argument, {
          comments: true,
        }).trim()}}}`;
        break;
      case NodeTypes.BinaryExpression:
        // this is cases where we have string concatenation
        requiredArgument = `{{${generate(argument, {
          comments: true,
        }).trim()}}}`;
        break;
      default:
        requiredArgument = argument
          ? `{{${generate(argument, { comments: true }).trim()}}}`
          : "";
        break;
    }
  }

  return requiredArgument;
};

export const setTextArgumentAtPosition = (
  currentValue: string,
  changeValue: any,
  argNum: number,
  evaluationVersion: number,
): string => {
  // Takes a function string and a value to be changed at a particular position
  // it returns the replaced function string with current value at argNum position
  let ast: Node = { end: 0, start: 0, type: "" };
  let changedValue: string = currentValue;
  const commentArray: Array<Comment> = [];
  let astWithComments;
  const rawValue =
    typeof changeValue === "string"
      ? String.raw`"${changeValue}"`
      : String.raw`${changeValue}`;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const changeValueScript = sanitizeScript(rawValue, evaluationVersion);

    getAST(changeValueScript, {
      locations: true,
      ranges: true,
    });
    const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
    const __ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // clone ast to avoid mutating original ast
    ast = klona(__ast);
    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid return original string
    throw error;
  }

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    const startPosition = node.callee.end + NEXT_POSITION;

    node.arguments = node.arguments || [];
    node.arguments[argNum] = {
      type: NodeTypes.Literal,
      value: changeValue,
      raw: rawValue,
      start: startPosition,
      // add 2 for quotes
      end: startPosition + (changeValue.length + LENGTH_OF_QUOTES),
    };
    changedValue = `{{${generate(astWithComments, {
      comments: true,
    }).trim()}}}`;
  }

  return changedValue;
};

export const setCallbackFunctionField = (
  currentValue: string,
  changeValue: string,
  argNum: number,
  evaluationVersion: number,
): string => {
  // Takes a function string and a callback function to be changed at a particular position
  // it returns the replaced function string with current callback at argNum position
  let ast: Node = { end: 0, start: 0, type: "" };
  let changeValueAst: Node = { end: 0, start: 0, type: "" };
  let changedValue: string = currentValue;
  const changedValueCommentArray: Array<Comment> = [];
  const currentValueCommentArray: Array<Comment> = [];
  let changeValueAstWithComments, currentValueAstWithComments;
  let requiredNode:
    | ArrowFunctionExpressionNode
    | MemberExpressionNode
    | BinaryExpressionNode
    | CallExpressionNode
    | BlockStatementNode
    | LiteralNode;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: currentValueCommentArray,
    });

    const sanitizedChangeValue = sanitizeScript(changeValue, evaluationVersion);

    changeValueAst = getAST(sanitizedChangeValue, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: changedValueCommentArray,
    });
    // attach comments to ast
    // clone ast to avoid mutating original ast
    changeValueAstWithComments = klona(
      attachCommentsToAst(changeValueAst, changedValueCommentArray),
    );
    currentValueAstWithComments = klona(
      attachCommentsToAst(ast, currentValueCommentArray),
    );
  } catch (error) {
    // if ast is invalid throw error
    throw error;
  }
  const changeValueNodeFound = findNodeAt(
    changeValueAstWithComments,
    0,
    undefined,
    (type) => type === "Program",
  );

  if (changeValueNodeFound) {
    requiredNode =
      // @ts-expect-error: types not matched
      changeValueNodeFound?.node?.body[0]?.expression ||
      changeValueNodeFound.node;
  }

  const found = findNodeAt(
    currentValueAstWithComments,
    0,
    undefined,
    (_type, node) => isCallExpressionNode(node),
  );

  if (found) {
    const { node } = found;

    // When there is an argument after the specified argument number, then only add empty string literal
    // @ts-expect-error: types not matched
    if (changeValue === "" && node.arguments[argNum + 1]) {
      requiredNode = {
        type: NodeTypes.Literal,
        value: `${changeValue}`,
        raw: `'${String.raw`${changeValue}`}'`,
        start: 0,
        end: 2,
      };
    }

    // @ts-expect-error: types not matched
    if (node.arguments[argNum]) {
      // @ts-expect-error: types not matched
      node.arguments[argNum] = requiredNode;
    } else {
      // @ts-expect-error: types not matched
      node.arguments.push(requiredNode);
    }

    changedValue = generate(currentValueAstWithComments, {
      comments: true,
    }).trim();

    try {
      getAST(changedValue);
    } catch (e) {
      throw e;
    }
  }

  return changedValue;
};

export const setObjectAtPosition = (
  currentValue: string,
  changeValue: any,
  argNum: number,
  evaluationVersion: number,
): string => {
  // Takes a function string and an object to be changed at a particular position
  // it returns the replaced function string with the object at argNum position
  if (
    typeof changeValue !== "string" ||
    changeValue === "" ||
    changeValue.trim() === ""
  ) {
    changeValue = "{}";
  }

  changeValue = changeValue.trim();
  let ast: Node = { end: 0, start: 0, type: "" };
  let changedValue: string = currentValue;
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
    const __ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // clone ast to avoid mutating original ast
    ast = klona(__ast);

    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid throw error
    throw error;
  }

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    const startPosition = node.callee.end + NEXT_POSITION;

    node.arguments[argNum] = {
      type: NodeTypes.Literal,
      value: changeValue,
      raw: String.raw`${changeValue}`,
      start: startPosition,
      // add 2 for quotes
      end: startPosition + (changeValue.length + LENGTH_OF_QUOTES),
    };
    changedValue = generate(astWithComments, { comments: true }).trim();
    try {
      getAST(changedValue);
    } catch (e) {
      throw e;
    }
  }

  return `{{${changedValue}}}`;
};

export const getEnumArgumentAtPosition = (
  value: string,
  argNum: number,
  defaultValue: string,
  evaluationVersion: number,
): string => {
  // Takes a function string and return enum argument at a particular position
  // enum argument -> this is for selectors
  let ast: Node = { end: 0, start: 0, type: "" };
  let requiredArgument: string = defaultValue;
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    // const wrappedCode = wrapCode(sanitizedScript);
    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid return default value
    return defaultValue;
  }

  // Api1.run(() => { showAlert("", () => { showAlert("") }) })

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    if (node.arguments[argNum]) {
      const argument = node.arguments[argNum];

      switch (argument?.type) {
        case NodeTypes.Literal:
          requiredArgument = argument.raw as string;
      }
    }
  }

  return requiredArgument;
};

export const setEnumArgumentAtPosition = (
  currentValue: string,
  changeValue: string,
  argNum: number,
  evaluationVersion: number,
): string => {
  // Takes a function string and an enum argument to be changed at a particular position
  // it returns the replaced function string with enum arg at argNum position
  // enum arg -> selectors
  let ast: Node = { end: 0, start: 0, type: "" };
  let changedValue: string = currentValue;
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
    const __ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // clone ast to avoid mutating original ast
    ast = klona(__ast);

    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid throw error
    throw error;
  }

  try {
    getAST(changeValue);
  } catch (e) {
    return currentValue;
  }
  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    // add 1 to get the starting position of the next
    // node to ending position of previous
    const startPosition = node.callee.end + NEXT_POSITION;

    node.arguments[argNum] = {
      type: NodeTypes.Literal,
      value: `${changeValue}`,
      raw: String.raw`${changeValue}`,
      start: startPosition,
      // add 2 for quotes
      end: startPosition + (changeValue.length + LENGTH_OF_QUOTES),
    };
    changedValue = `{{${generate(astWithComments, {
      comments: true,
    }).trim()}}}`;
  }

  return changedValue;
};

export const getModalName = (
  value: string,
  evaluationVersion: number,
): string => {
  // Takes a function string and returns modal name at a particular position
  let ast: Node = { end: 0, start: 0, type: "" };
  let modalName = "none";
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(value, evaluationVersion);
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });
    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid return modal name
    return modalName;
  }

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    const argument = node.arguments[0];

    switch (argument?.type) {
      case NodeTypes.Literal:
        modalName = argument.value as string;
        break;
      case NodeTypes.MemberExpression:
        // this is for cases where we have {{showModal(Modal1.name)}} or {{closeModal(Modal1.name)}}
        // modalName = Modal1.name;
        modalName = generate(argument, {
          comments: true,
        }).trim();
        break;
    }
  }

  return modalName;
};

export const setModalName = (
  currentValue: string,
  changeValue: string,
  evaluationVersion: number,
) => {
  // takes function string as input and sets modal name at particular position
  let ast: Node = { end: 0, start: 0, type: "" };
  let changedValue: string = currentValue;
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(currentValue, evaluationVersion);
    const __ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // clone ast to avoid mutating original ast
    ast = klona(__ast);

    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid throw error
    throw error;
  }

  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    // add 1 to get the starting position of the next
    // node to ending position of previous
    const startPosition = node.callee.end + NEXT_POSITION;
    const newNode: LiteralNode = {
      type: NodeTypes.Literal,
      value: `${changeValue}`,
      raw: String.raw`${changeValue}`,
      start: startPosition,
      // add 2 for quotes
      end: startPosition + (changeValue.length + LENGTH_OF_QUOTES),
    };

    node.arguments = [newNode];
    changedValue = `{{${generate(astWithComments, {
      comments: true,
    }).trim()}}}`;
  }

  return changedValue;
};

export const getFuncExpressionAtPosition = (
  value: string,
  argNum: number,
  evaluationVersion: number,
): string => {
  // takes a function string and returns the function expression at the position
  let ast: Node = { end: 0, start: 0, type: "" };
  let requiredArgument = "() => {}";
  const commentArray: Array<Comment> = [];

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // attach comments to ast
    const astWithComments = attachCommentsToAst(ast, commentArray);

    /**
     * We need to traverse the ast to find the first callee
     * For Eg. Api1.run(() => {}, () => {}).then(() => {}).catch(() => {})
     * We have multiple callee above, the first one is run
     * Similarly, for eg. appsmith.geolocation.getCurrentPosition(() => {}, () => {});
     * For this one, the first callee is getCurrentPosition
     */
    const firstCallExpressionNode = findRootCallExpression(astWithComments);

    const argumentNode = firstCallExpressionNode?.arguments[argNum];

    if (
      argumentNode &&
      (isTypeOfFunction(argumentNode.type) ||
        isCallExpressionNode(argumentNode))
    ) {
      requiredArgument = `${generate(argumentNode, { comments: true })}`;
    } else {
      requiredArgument = "";
    }

    return requiredArgument;
  } catch (error) {
    // if ast is invalid return the blank function
    return requiredArgument;
  }
};

export const getFunction = (
  value: string,
  evaluationVersion: number,
): string => {
  // returns the function name from the function expression
  let ast: Node = { end: 0, start: 0, type: "" };
  let requiredFunction = "";
  const commentArray: Array<Comment> = [];
  let astWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(value, evaluationVersion);
    const wrappedCode = wrapCode(sanitizedScript);

    ast = getAST(wrappedCode, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    // attach comments to ast
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    // if ast is invalid return the original function
    return requiredFunction;
  }
  const node = findRootCallExpression(astWithComments);

  if (node && isCallExpressionNode(node)) {
    const func = `${generate(node)}`;

    requiredFunction = func !== "{}" ? `{{${func}}}` : "";
  }

  return requiredFunction;
};

export const replaceActionInQuery = (
  query: string,
  changeAction: string,
  argNum: number,
  evaluationVersion: number,
) => {
  // takes a query in this format -> Api.run( () => {}, () => {})
  // takes an action and its position and replaces it
  let ast: Node = { end: 0, start: 0, type: "" };
  let changeActionAst: Node = { end: 0, start: 0, type: "" };
  let requiredNode: ArrowFunctionExpressionNode = {
    end: 0,
    start: 0,
    type: NodeTypes.ArrowFunctionExpression,
    params: [],
    id: null,
    async: false,
  };
  let requiredQuery = "";
  const commentArray: Array<Comment> = [];
  const changeActionCommentArray: Array<Comment> = [];
  let astWithComments: any, changeActionAstWithComments;

  try {
    // sanitize to remove unnecessary characters which might lead to invalid ast
    const sanitizedScript = sanitizeScript(query, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: commentArray,
    });

    const sanitizedChangeAction = sanitizeScript(
      changeAction,
      evaluationVersion,
    );

    changeActionAst = getAST(sanitizedChangeAction, {
      locations: true,
      ranges: true,
      // collect all comments as they are not part of the ast, we will attach them back on line 46
      onComment: changeActionCommentArray,
    });

    // attach comments to ast
    // clone ast to avoid mutating original ast
    astWithComments = klona(attachCommentsToAst(ast, commentArray));
    changeActionAstWithComments = klona(
      attachCommentsToAst(changeActionAst, changeActionCommentArray),
    );
  } catch (error) {
    // if ast is invalid throw error
    throw error;
  }

  simple(changeActionAstWithComments, {
    ArrowFunctionExpression(node) {
      if (isArrowFunctionExpression(node)) {
        requiredNode = node;
      }
    },
  });

  simple(astWithComments, {
    CallExpression(node: Node) {
      if (
        isCallExpressionNode(node) &&
        isMemberExpressionNode(node.callee) &&
        node.arguments[argNum]
      ) {
        // add 1 to get the starting position of the next
        // node to ending position of previous
        const startPosition = node.arguments[argNum].start;

        requiredNode.start = startPosition;
        requiredNode.end = startPosition + changeAction.length;
        node.arguments[argNum] = requiredNode;
        requiredQuery = `${generate(astWithComments, {
          comments: true,
        }).trim()}`;
      }
    },
  });

  return requiredQuery;
};

/**
 * This function gets the action blocks which are basically the individual expression statements in the code
 */
export function getActionBlocks(
  value: string,
  evaluationVersion: number,
): Array<string> {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  const actionBlocks: Array<string> = [];
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return actionBlocks;
  }

  astWithComments.body.forEach((node: Node) => {
    actionBlocks.push(generate(node, { comments: true }).trim());
  });

  return actionBlocks;
}

/**
 * This function gets the action block top-level names
 */
export function canTranslateToUI(
  value: string,
  evaluationVersion: number,
): boolean {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  let canTranslate = true;
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return false;
  }

  simple(astWithComments, {
    ConditionalExpression(node) {
      if (
        isCallExpressionNode(node.consequent) ||
        isCallExpressionNode(node.alternate)
      ) {
        canTranslate = false;
      }
    },
    LogicalExpression(node) {
      if (isCallExpressionNode(node.left) || isCallExpressionNode(node.right)) {
        canTranslate = false;
      }
    },
  });

  if (!canTranslate) return canTranslate;

  for (const node of astWithComments.body) {
    if (isExpressionStatementNode(node)) {
      const expression = node.expression;

      if (!isCallExpressionNode(expression)) {
        canTranslate = false;
        break;
      }

      const rootCallExpression = findRootCallExpression(
        expression,
      ) as CallExpressionNode;

      if (!rootCallExpression) {
        canTranslate = false;
        break;
      }
    } else {
      canTranslate = false;
    }
  }

  return canTranslate;
}

export function getFunctionBodyStatements(
  value: string,
  evaluationVersion: number,
): Array<string> {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });

    const astWithComments = attachCommentsToAst(ast, commentArray);

    const mainBody = astWithComments.body[0];

    let statementsBody = [];

    switch (mainBody.type) {
      case NodeTypes.ExpressionStatement:
        if (mainBody.expression.body.type === NodeTypes.BlockStatement)
          statementsBody = mainBody.expression.body.body;
        else if (mainBody.expression.body.type === NodeTypes.CallExpression)
          statementsBody = [mainBody.expression.body];

        break;
      case NodeTypes.FunctionDeclaration:
        statementsBody = mainBody.body.body;
        break;
    }

    return statementsBody.map((node: Node) =>
      generate(node, { comments: true }).trim(),
    );
  } catch (error) {
    return [];
  }
}

export function getMainAction(
  value: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  let mainAction = "";
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return mainAction;
  }

  simple(astWithComments, {
    ExpressionStatement(node) {
      simple(node, {
        CallExpression(node) {
          if (node.callee.type === NodeTypes.Identifier) {
            mainAction = generate(node, { comments: true }).trim();
          } else {
            mainAction =
              generate(node.callee, { comments: true }).trim() + "()";
          }
        },
      });
    },
  });

  return mainAction;
}

export function getFunctionName(
  value: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  const functionName = "";

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    const astWithComments = attachCommentsToAst(ast, commentArray);

    const firstCallExpressionNode = findRootCallExpression(astWithComments);

    return firstCallExpressionNode
      ? generate(firstCallExpressionNode?.callee, { comments: true })
      : "";
  } catch (error) {
    return functionName;
  }
}

// this function extracts the then/catch blocks when query is in this form
// Api1.run(() => {}, () => {}, {}).then(() => {}).catch(() => {}), or
// Api1.run(() => {}, () => {}, {}).then(() => {}), or
// Api1.run(() => {}, () => {}, {}).catch(() => {}), or
export function getThenCatchBlocksFromQuery(
  value: string,
  evaluationVersion: number,
) {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  const returnValue: Record<string, string> = {};

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });

    const astWithComments = attachCommentsToAst(ast, commentArray);

    const rootCallExpression = findRootCallExpression(astWithComments);

    if (!rootCallExpression) return returnValue;

    let firstBlockType;

    const firstBlock = findNodeAt(
      astWithComments,
      0,
      undefined,
      function (_type, node) {
        if (isCallExpressionNode(node)) {
          if (isMemberExpressionNode(node.callee)) {
            if (node.callee.object === rootCallExpression) {
              if (isIdentifierNode(node.callee.property)) {
                if (["then", "catch"].includes(node.callee.property.name)) {
                  firstBlockType = node.callee.property.name;

                  return true;
                }
              }
            }
          }
        }

        return false;
      },
    )?.node;

    if (!firstBlock) return returnValue;

    if (!isCallExpressionNode(firstBlock) || !firstBlockType)
      return returnValue;

    const args = firstBlock.arguments;

    if (args.length) {
      returnValue[firstBlockType] = generate(args[0]);
    }

    const secondBlockType = firstBlockType === "then" ? "catch" : "then";
    const secondBlock = findNodeAt(ast, 0, undefined, function (_type, node) {
      if (isCallExpressionNode(node)) {
        if (isMemberExpressionNode(node.callee)) {
          if (node.callee.object === firstBlock) {
            if (isIdentifierNode(node.callee.property))
              return node.callee.property.name === secondBlockType;
          }
        }
      }

      return false;
    })?.node;

    if (secondBlock && isCallExpressionNode(secondBlock)) {
      const args = secondBlock.arguments;

      if (args.length > 0) {
        returnValue[secondBlockType] = generate(args[0]);
      }
    }

    return returnValue;
  } catch (error) {
    return returnValue;
  }
}

export function setThenBlockInQuery(
  value: string,
  thenBlock: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  let requiredQuery = "";

  thenBlock = thenBlock || "() => {}";
  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });

    const astWithComments = attachCommentsToAst(ast, commentArray);

    const rootCallExpression = findRootCallExpression(astWithComments);
    let thenCallExpressionInGivenQuery = findNodeAt(
      astWithComments,
      0,
      undefined,
      function (_type, node) {
        if (isCallExpressionNode(node)) {
          if (isMemberExpressionNode(node.callee)) {
            if (node.callee.object === rootCallExpression) {
              if (isIdentifierNode(node.callee.property)) {
                return node.callee.property.name === "then";
              }
            }
          }
        }

        return false;
      },
    )?.node;

    if (!thenCallExpressionInGivenQuery) {
      const expression = rootCallExpression;

      const callExpression = {
        type: NodeTypes.CallExpression,
        start: expression.start,
        end: expression.end + 7,
        callee: {
          type: NodeTypes.MemberExpression,
          object: expression,
          start: expression.start,
          end: expression.end + 5,
          property: {
            type: NodeTypes.Identifier,
            name: "then",
            start: expression.end + 1,
            end: expression.end + 5,
          },
        },
      };

      astWithComments.body[0].expression = callExpression;
      astWithComments.body[0].end = callExpression.end;
    }

    thenCallExpressionInGivenQuery = findNodeAt(
      astWithComments,
      0,
      undefined,
      function (_type, node) {
        if (isCallExpressionNode(node)) {
          if (isMemberExpressionNode(node.callee)) {
            if (node.callee.object === rootCallExpression) {
              if (isIdentifierNode(node.callee.property)) {
                return node.callee.property.name === "then";
              }
            }
          }
        }

        return false;
      },
    )?.node;

    const thenBlockNode = getAST(thenBlock, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    const thenBlockNodeWithComments = attachCommentsToAst(
      thenBlockNode,
      commentArray,
    );

    if (thenCallExpressionInGivenQuery) {
      // @ts-expect-error: types not matched
      thenCallExpressionInGivenQuery.arguments = [
        thenBlockNodeWithComments.body[0].expression,
      ];
    }

    requiredQuery = `${generate(astWithComments, { comments: true }).trim()}`;

    return requiredQuery;
  } catch (error) {
    return requiredQuery;
  }
}

export function setCatchBlockInQuery(
  value: string,
  catchBlock: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  let requiredQuery = "";

  catchBlock = catchBlock || "() => {}";
  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });

    const astWithComments = attachCommentsToAst(ast, commentArray);

    const rootCallExpression = findRootCallExpression(ast);
    let catchCallExpressionInGivenQuery = findNodeWithCalleeAndProperty(
      astWithComments,
      rootCallExpression,
      "catch",
    );

    if (!catchCallExpressionInGivenQuery) {
      const thenCallExpressionInGivenQuery = findNodeWithCalleeAndProperty(
        astWithComments,
        rootCallExpression,
        "then",
      );

      catchCallExpressionInGivenQuery =
        thenCallExpressionInGivenQuery &&
        findNodeWithCalleeAndProperty(
          astWithComments,
          thenCallExpressionInGivenQuery,
          "catch",
        );

      if (!catchCallExpressionInGivenQuery) {
        const expression = klona(
          thenCallExpressionInGivenQuery ?? rootCallExpression,
        );
        const callExpression = {
          type: NodeTypes.CallExpression,
          start: expression.start,
          end: expression.end + 8,
          callee: {
            type: NodeTypes.MemberExpression,
            start: expression.start,
            end: expression.end + 6,
            object: expression,
            property: {
              type: NodeTypes.Identifier,
              name: "catch",
              start: expression.end + 2,
              end: expression.end + 7,
            },
          },
        };

        catchCallExpressionInGivenQuery = callExpression;
        astWithComments.body[0].expression = catchCallExpressionInGivenQuery;
      }
    }

    const catchBlockNode = getAST(catchBlock, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    const catchBlockNodeWithComments = attachCommentsToAst(
      catchBlockNode,
      commentArray,
    );

    if (catchCallExpressionInGivenQuery) {
      // @ts-expect-error: types not matched
      catchCallExpressionInGivenQuery.arguments = [
        catchBlockNodeWithComments.body[0].expression,
      ];
    }

    requiredQuery = `${generate(astWithComments, { comments: true }).trim()}`;

    return requiredQuery;
  } catch (error) {
    return requiredQuery;
  }
}

export function getFunctionArguments(
  value: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  const argumentsArray: Array<any> = [];
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return "";
  }

  const rootCallExpression = findRootCallExpression(astWithComments);

  const args = rootCallExpression.arguments || [];

  for (const argument of args) {
    argumentsArray.push(generate(argument));
  }

  return argumentsArray.join(", ");
}

export function getFunctionNameFromJsObjectExpression(
  value: string,
  evaluationVersion: number,
): string {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  let functionName = "";
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return functionName;
  }

  const rootCallExpression = findRootCallExpression(astWithComments);

  if (rootCallExpression && isCallExpressionNode(rootCallExpression)) {
    if (isMemberExpressionNode(rootCallExpression.callee)) {
      if (isIdentifierNode(rootCallExpression.callee.property)) {
        functionName = rootCallExpression.callee.property.name;
      }
    }
  }

  return functionName;
}

// function to get all call expressions in a given query
export function getCallExpressions(
  value: string,
  evaluationVersion: number,
): Array<any> {
  let ast: Node = { end: 0, start: 0, type: "" };
  const commentArray: Array<Comment> = [];
  const callExpressions: Array<any> = [];
  let astWithComments;

  try {
    const sanitizedScript = sanitizeScript(value, evaluationVersion);

    ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });
    astWithComments = attachCommentsToAst(ast, commentArray);
  } catch (error) {
    return callExpressions;
  }

  simple(astWithComments, {
    CallExpression(node) {
      callExpressions.push({
        code: generate(node).trim(),
        callee: generate((node as CallExpressionNode).callee).trim(),
        arguments: (node as CallExpressionNode).arguments.map((argument) =>
          generate(argument).trim(),
        ),
      });
    },
  });

  return callExpressions;
}

function findRootCallExpression(ast: Node) {
  const callExpressions: CallExpressionNode[] = [];

  simple(ast, {
    CallExpression(node) {
      if (isCallExpressionNode(node)) callExpressions.push(node);
    },
  });

  /**
   * rootCallExpression should have the smallest start offset.
   * In case there are multiple CallExpressions with the same start offset,
   * pick the one the that has the least end offset.
   */
  let rootCallExpression = callExpressions[0];

  for (const ce of callExpressions) {
    if (rootCallExpression.start === ce.start) {
      rootCallExpression =
        ce.end < rootCallExpression.end ? ce : rootCallExpression;
    } else if (rootCallExpression.start > ce.start) {
      rootCallExpression = ce;
    }
  }

  return rootCallExpression;
}

function findNodeWithCalleeAndProperty(
  ast: Node,
  callee?: Node,
  property?: string,
) {
  if (!ast || !callee || !property) return undefined;

  return findNodeAt(ast, 0, undefined, function (_type, node) {
    if (isCallExpressionNode(node)) {
      if (isMemberExpressionNode(node.callee)) {
        if (node.callee.object === callee) {
          if (isIdentifierNode(node.callee.property)) {
            return node.callee.property.name === property;
          }
        }
      }
    }

    return false;
  })?.node;
}

export function getFunctionParams(code: string, evaluationVersion: number) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);

    code = `let a = ${sanitizedScript.trim()}`;
    const ast = getAST(code, {
      locations: true,
      ranges: true,
    });
    // @ts-expect-error: types not matched
    const functionExpression = ast.body[0].declarations[0].init;
    const params =
      functionExpression.params?.map((param: any) => generate(param).trim()) ||
      [];

    return params;
  } catch (e) {
    return [];
  }
}

export function getQueryParam(
  code: string,
  _number: number,
  evaluationVersion: number,
) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });

    const rootCallExpression = findRootCallExpression(ast);

    if (!rootCallExpression) return `{{ {} }}`;

    const args = rootCallExpression.arguments;

    if (!args || args.length === 0) return `{{{}}}`;

    const firstArg = args[0] || ({} as ArgumentTypes);

    if (firstArg.type && !isTypeOfFunction(firstArg.type)) {
      return getTextArgumentAtPosition(code, 0, evaluationVersion);
    }

    const thirdArg = args[2] || ({} as ArgumentTypes);

    if (thirdArg.type && !isTypeOfFunction(thirdArg.type)) {
      return getTextArgumentAtPosition(code, 2, evaluationVersion);
    }

    return `{{{}}}`;
  } catch (e) {
    return `{{{}}}`;
  }
}

export function setQueryParam(
  code: string,
  value: string,
  position: number,
  evaluationVersion: number,
) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });

    const rootCallExpression = findRootCallExpression(ast);

    if (!rootCallExpression) return code;

    if (position === 0) {
      rootCallExpression.arguments = [];
      code = generate(ast);

      return setObjectAtPosition(code, value, position, evaluationVersion);
    } else {
      const firstArg = rootCallExpression.arguments[0] || ({} as ArgumentTypes);
      const secondArg =
        rootCallExpression.arguments[1] || ({} as ArgumentTypes);

      if (firstArg && !isTypeOfFunction(firstArg.type)) {
        code = setCallbackFunctionField(code, "() => {}", 0, evaluationVersion);
      }

      if (secondArg && !isTypeOfFunction(secondArg.type)) {
        code = setCallbackFunctionField(code, "() => {}", 1, evaluationVersion);
      }

      return setObjectAtPosition(code, value, 2, evaluationVersion);
    }
  } catch (e) {
    return code;
  }
}

export function checkIfThenBlockExists(
  code: string,
  evaluationVersion: number,
) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });
    const rootCallExpression = findRootCallExpression(ast);

    if (!rootCallExpression) return code;

    let thenBlock = findNodeWithCalleeAndProperty(
      ast,
      rootCallExpression,
      "then",
    );

    if (thenBlock) return true;

    const catchBlock = findNodeWithCalleeAndProperty(
      ast,
      rootCallExpression,
      "catch",
    );

    thenBlock = findNodeWithCalleeAndProperty(ast, catchBlock, "then");

    if (thenBlock) return true;

    return false;
  } catch (e) {
    return false;
  }
}

export function checkIfCatchBlockExists(
  code: string,
  evaluationVersion: number,
) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });
    const rootCallExpression = findRootCallExpression(ast);

    if (!rootCallExpression) return code;

    let catchBlock = findNodeWithCalleeAndProperty(
      ast,
      rootCallExpression,
      "catch",
    );

    if (catchBlock) return true;

    const thenBlock = findNodeWithCalleeAndProperty(
      ast,
      rootCallExpression,
      "then",
    );

    catchBlock = findNodeWithCalleeAndProperty(ast, thenBlock, "catch");

    if (catchBlock) return true;

    return false;
  } catch (e) {
    return false;
  }
}

export function checkIfArgumentExistAtPosition(
  code: string,
  position: number,
  evaluationVersion: number,
) {
  try {
    const sanitizedScript = sanitizeScript(code, evaluationVersion);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
    });
    const rootCallExpression = findRootCallExpression(ast);

    if (!rootCallExpression) return false;

    const args = rootCallExpression.arguments;

    if (!args || args.length === 0 || !args[position]) return false;

    return true;
  } catch (e) {
    return false;
  }
}

export function setGenericArgAtPostition(
  arg: string,
  code: string,
  position: number,
) {
  try {
    const commentArray: Array<Comment> = [];
    const argCommentArray: Array<Comment> = [];
    const sanitizedScript = sanitizeScript(code, 2);
    const ast = getAST(sanitizedScript, {
      locations: true,
      ranges: true,
      onComment: commentArray,
    });

    arg = arg.trim();
    const astWithComments = attachCommentsToAst(ast, commentArray);

    let argAst;
    let argASTWithComments;
    let argNode;

    try {
      argAst = getAST(arg, {
        locations: true,
        ranges: true,
        onComment: argCommentArray,
      });
      argASTWithComments = attachCommentsToAst(argAst, argCommentArray);

      if (isBlockStatementNode(argASTWithComments.body[0])) {
        throw "Object interpretted as Block statement";
      }

      argNode = argASTWithComments.body[0].expression;
    } catch (e) {
      // If the arg is { a: 2 }, ast will BlockStatement and would end up here.
      // If the arg is { a: 2, b: 3 }, ast will throw error and would end up here.
      argAst = getAST(`var temp = ${arg}`, {
        locations: true,
        ranges: true,
        onComment: argCommentArray,
      });
      argASTWithComments = attachCommentsToAst(argAst, argCommentArray);
      argNode = argASTWithComments.body[0].declarations[0].init;
    }

    const rootCallExpression = findRootCallExpression(astWithComments);

    if (!rootCallExpression) return code;

    const args = rootCallExpression.arguments || [];

    args[position] = argNode;
    rootCallExpression.arguments = args;

    return generate(ast).trim();
  } catch (e) {
    return code;
  }
}
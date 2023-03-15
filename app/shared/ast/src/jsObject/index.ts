import { Node } from "acorn";
import { ancestor } from "acorn-walk";
import { getAST, isPropertyNode, isTypeOfFunction } from "../index";
import { generate } from "astring";
import {
  getFunctionalParamsFromNode,
  isPropertyAFunctionNode,
  functionParam,
} from "../index";
import { SourceType, NodeTypes } from "../../index";
import { attachComments } from "astravel";
import { extractContentByPosition } from "../utils";

const jsObjectVariableName =
  "____INTERNAL_JS_OBJECT_NAME_USED_FOR_PARSING_____";

export const jsObjectDeclaration = `var ${jsObjectVariableName} =`;

export interface JSPropertyPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  keyStartLine: number;
  keyEndLine: number;
  keyStartColumn: number;
  keyEndColumn: number;
}

interface baseJSProperty {
  key: string;
  value: string;
  type: string;
  position: Partial<JSPropertyPosition>;
  rawContent: string;
}

type JSFunctionProperty = baseJSProperty & {
  arguments: functionParam[];
};
type JSVarProperty = baseJSProperty;

export type TParsedJSProperty = JSVarProperty | JSFunctionProperty;

export const isJSFunctionProperty = (
  t: TParsedJSProperty,
): t is JSFunctionProperty => {
  return isTypeOfFunction(t.type);
};

export const parseJSObject = (code: string) => {
  let ast: Node = { end: 0, start: 0, type: "" };
  const result: TParsedJSProperty[] = [];
  try {
    const comments: any = [];
    ast = getAST(code, { sourceType: SourceType.module, onComment: comments });
    attachComments(ast, comments);
  } catch (e) {
    return { parsedObject: result, success: false };
  }

  ancestor(ast, {
    Property(node, ancestors: Node[]) {
      // We are only interested in identifiers at this depth (exported object keys)
      const depth = ancestors.length - 3;
      if (
        isPropertyNode(node) &&
        node.loc &&
        node.key.loc &&
        ancestors[depth] &&
        ancestors[depth].type === NodeTypes.ExportDefaultDeclaration
      ) {
        let property: TParsedJSProperty = {
          key: generate(node.key),
          value: generate(node.value),
          rawContent: extractContentByPosition(code, {
            from: {
              line: node.loc.start.line - 1,
              ch: node.loc.start.column,
            },
            to: {
              line: node.loc.end.line - 1,
              ch: node.loc.end.column - 1,
            },
          }),
          type: node.value.type,
          position: {
            startLine: node.loc.start.line,
            startColumn: node.loc.start.column,
            endLine: node.loc.end.line,
            endColumn: node.loc.end.column,
            keyStartLine: node.key.loc.start.line,
            keyEndLine: node.key.loc.end.line,
            keyStartColumn: node.key.loc.start.column,
            keyEndColumn: node.key.loc.end.column,
          },
        };
        if (isPropertyAFunctionNode(node.value)) {
          // if in future we need default values of each param, we could implement that in getFunctionalParamsFromNode
          // currently we don't consume it anywhere hence avoiding to calculate that.
          const params = getFunctionalParamsFromNode(node.value);
          property = {
            ...property,
            arguments: [...params],
          };
        }
        result.push(property);
      }
    },
  });
  return { parsedObject: result, success: true };
};

import { Node } from "acorn";
import { ancestor, simple } from "acorn-walk";
import { getAST, isPropertyNode, isTypeOfFunction } from "../index";
import { generate } from "astring";
import {
  getFunctionalParamsFromNode,
  isPropertyAFunctionNode,
  isVariableDeclarator,
  isObjectExpression,
  PropertyNode,
  functionParam,
} from "../index";
import { SourceType, NodeTypes } from "../../index";
import { attachComments } from "astravel";
import { extractContentByPosition } from "../utils";

type JsObjectProperty = {
  key: string;
  value: string;
  type: string;
  arguments?: Array<functionParam>;
};

const jsObjectVariableName =
  "____INTERNAL_JS_OBJECT_NAME_USED_FOR_PARSING_____";

export const jsObjectDeclaration = `var ${jsObjectVariableName} =`;

export const parseJSObjectWithAST = (
  jsObjectBody: string,
): Array<JsObjectProperty> => {
  /* 
      jsObjectVariableName value is added such actual js code would never name same variable name. 
      if the variable name will be same then also we won't have problem here as jsObjectVariableName will be last node in VariableDeclarator hence overriding the previous JSObjectProperties.
      Keeping this just for sanity check if any caveat was missed.
    */
  const jsCode = `${jsObjectDeclaration} ${jsObjectBody}`;

  const ast = getAST(jsCode);

  const parsedObjectProperties = new Set<JsObjectProperty>();
  let JSObjectProperties: Array<PropertyNode> = [];

  simple(ast, {
    VariableDeclarator(node: Node) {
      if (
        isVariableDeclarator(node) &&
        node.id.name === jsObjectVariableName &&
        node.init &&
        isObjectExpression(node.init)
      ) {
        JSObjectProperties = node.init.properties;
      }
    },
  });

  JSObjectProperties.forEach((node) => {
    let params = new Set<functionParam>();
    const propertyNode = node;
    let property: JsObjectProperty = {
      key: generate(propertyNode.key),
      value: generate(propertyNode.value),
      type: propertyNode.value.type,
    };

    if (isPropertyAFunctionNode(propertyNode.value)) {
      // if in future we need default values of each param, we could implement that in getFunctionalParamsFromNode
      // currently we don't consume it anywhere hence avoiding to calculate that.
      params = getFunctionalParamsFromNode(propertyNode.value);
      property = {
        ...property,
        arguments: [...params],
      };
    }

    // here we use `generate` function to convert our AST Node to JSCode
    parsedObjectProperties.add(property);
  });

  return [...parsedObjectProperties];
};
export interface JSPropertyPosition {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface baseJSProperty {
  key: string;
  value: string;
  type: string;
  position: Partial<JSPropertyPosition>;
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
    return result;
  }

  ancestor(ast, {
    Property(node, ancestors: Node[]) {
      // We are only interested in identifiers at this depth (exported object keys)
      const depth = ancestors.length - 3;
      if (
        isPropertyNode(node) &&
        node.value.loc &&
        ancestors[depth] &&
        ancestors[depth].type === NodeTypes.ExportDefaultDeclaration
      ) {
        let property: TParsedJSProperty = {
          key: generate(node.key, { comments: true }),
          value: extractContentByPosition(code, {
            from: {
              line: node.value.loc.start.line - 1,
              ch: node.value.loc.start.column,
            },
            to: {
              line: node.value.loc.end.line - 1,
              ch: node.value.loc.end.column - 1,
            },
          }),
          type: node.value.type,
          position: {
            startLine: node.value.loc.start.line,
            startColumn: node.value.loc.start.column,
            endLine: node.value.loc.end.line,
            endColumn: node.value.loc.end.column,
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
  return result;
};

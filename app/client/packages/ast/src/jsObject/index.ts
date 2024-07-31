import { parseExpressionAt, type Node } from "acorn";
import { simple } from "acorn-walk";
import type {
  IdentifierNode,
  LiteralNode,
  NodeWithLocation,
  PropertyNode,
} from "../index";
import {
  getAST,
  isExportDefaultDeclarationNode,
  isObjectExpression,
  isTypeOfFunction,
} from "../index";
import { generate } from "astring";
import type { functionParam } from "../index";
import { getFunctionalParamsFromNode, isPropertyAFunctionNode } from "../index";
import { ECMA_VERSION, SourceType } from "../../index";
import escodegen, { attachComments } from "escodegen";
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

interface BaseJSProperty {
  key: string;
  value: string;
  type: string;
  position: Partial<JSPropertyPosition>;
  rawContent: string;
}

export type JSFunctionProperty = BaseJSProperty & {
  arguments: functionParam[];
  // If function uses the "async" keyword
  isMarkedAsync: boolean;
};
export type JSVarProperty = BaseJSProperty;

export type TParsedJSProperty = JSVarProperty | JSFunctionProperty;

interface Property extends PropertyNode {
  key: IdentifierNode;
}

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
    const token: any = [];
    ast = getAST(code, {
      sourceType: SourceType.module,
      onComment: comments,
      onToken: token,
      ranges: true,
      locations: true,
    });
    attachComments(ast, comments, token);
  } catch (e) {
    return { parsedObject: result, success: false };
  }

  const parsedObjectProperties = new Set<TParsedJSProperty>();
  let JSObjectProperties: NodeWithLocation<PropertyNode>[] = [];

  simple(ast, {
    ExportDefaultDeclaration(node) {
      if (
        !isExportDefaultDeclarationNode(node) ||
        !isObjectExpression(node.declaration)
      )
        return;
      JSObjectProperties = node.declaration
        .properties as NodeWithLocation<PropertyNode>[];
    },
  });

  JSObjectProperties.forEach((node) => {
    const propertyKey = node.key as NodeWithLocation<
      LiteralNode | IdentifierNode
    >;
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
        keyStartLine: propertyKey.loc.start.line,
        keyEndLine: propertyKey.loc.end.line,
        keyStartColumn: propertyKey.loc.start.column,
        keyEndColumn: propertyKey.loc.end.column,
      },
    };

    if (isPropertyAFunctionNode(node.value)) {
      const params = getFunctionalParamsFromNode(node.value, true, code);
      property = {
        ...property,
        arguments: [...params],
        isMarkedAsync: node.value.async,
      };
    }

    parsedObjectProperties.add(property);
  });

  return { parsedObject: [...parsedObjectProperties], success: true };
};

export const addPropertiesToJSObjectCode = (
  code: string,
  obj: Record<string, string>,
) => {
  try {
    const ast = getAST(code, { sourceType: "module" });

    simple(ast, {
      ExportDefaultDeclaration(node: any) {
        const properties: Property[] = node?.declaration?.properties;

        Object.entries(obj).forEach(([key, value]) => {
          // Check if a property with the same name already exists
          const existingPropertyIndex = properties.findIndex(
            (property) => property.key.name === key,
          );

          const astValue = parseExpressionAt(value, 0, {
            ecmaVersion: ECMA_VERSION,
          });

          // Create a new property
          const newProperty = {
            type: "Property",
            key: { type: "Identifier", name: key },
            value: astValue,
            kind: "init",
            method: false,
            shorthand: false,
            computed: false,
          } as unknown as Property;

          if (existingPropertyIndex >= 0) {
            // Replace the existing property
            properties[existingPropertyIndex] = newProperty;
          } else {
            // Add the new property
            properties.push(newProperty);
          }
        });
      },
    });
    return escodegen.generate(ast);
  } catch (e) {
    return code;
  }
};

import { Node } from "acorn";
import { getAST } from "../index";
import { generate } from "astring";
import { simple } from "acorn-walk";
import {
  getFunctionalParamsFromNode,
  isPropertyAFunctionNode,
  isVariableDeclarator,
  isObjectExpression,
  PropertyNode,
  functionParam,
} from "../index";

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
  jsObjectBody: string
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

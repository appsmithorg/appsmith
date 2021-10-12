/* eslint-disable @typescript-eslint/ban-ts-comment */
import { parse, Node } from "acorn";
import { ancestor } from "acorn-walk";

export const getAST = (code: string) => parse(code, { ecmaVersion: 2020 });

interface MemberExpressionNode extends Node {
  object: Node & {
    name: string;
  };
  property: Node & {
    name: string;
  };
}

export const getAllIdentifiers = (code: string): string[] => {
  const identifiers = new Set<string>();
  const locationsCovered: [number, number][] = [];
  const ast = getAST(code);
  ancestor(ast, {
    MemberExpression(node: Node) {
      let alreadyVisited = false;
      for (const locations of locationsCovered) {
        if (node.start <= locations[0] && node.end >= locations[1]) {
          alreadyVisited = true;
        }
      }
      if (!alreadyVisited) {
        locationsCovered.push([node.start, node.end]);
        let identifierName = "";
        // @ts-ignore
        identifierName = identifierName + node.object.name;
        // @ts-ignore
        identifierName = identifierName + "." + node.property.name;

        identifiers.add(identifierName);
      }
    },
    Identifier(node: Node, ancestors: Node[]) {
      if (ancestors[ancestors.length - 2].type !== "MemberExpression") {
        debugger;
        // @ts-ignore
        identifiers.add(node.name);
      }
    },
  });
  return Array.from(identifiers);
};

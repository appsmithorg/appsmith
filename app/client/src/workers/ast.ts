/* eslint-disable @typescript-eslint/ban-ts-comment */
import { parse, Node } from "acorn";
import { fullAncestor } from "acorn-walk";

export const getAST = (code: string) => parse(code, { ecmaVersion: 2020 });

export const getAllIdentifiers = (code: string): string[] => {
  const identifiers = new Set<string>();
  const ast = getAST(code);
  fullAncestor(ast, (node: Node, _: any, ancestors: Node[]) => {
    const lastAncestor = ancestors[ancestors.length - 2];

    if (
      node.type === "Identifier" &&
      lastAncestor.type === "MemberExpression"
    ) {
      let identifier = ``;

      debugger;
      identifier =
        identifier +
        // @ts-ignore
        lastAncestor.object.name +
        "." +
        // @ts-ignore
        lastAncestor.property.name;
      identifiers.add(identifier);
    }
  });
  return Array.from(identifiers);
};

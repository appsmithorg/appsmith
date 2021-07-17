import { generate } from "astring";
import { parse } from "acorn";

export const getAST = (code: string) => parse(code, { ecmaVersion: 2020 });
export const getFnContents = (code: string) => {
  const ast = getAST(code);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: ast has body, please believe me!
  const fnBlock = generate(ast.body[0].body);
  return fnBlock.substring(1, fnBlock.length - 1);
};

// Type definitions for path-to-regexp 0.1.12
// Project: https://github.com/pillarjs/path-to-regexp
// Definitions by: Devin AI
// Minimum TypeScript Version: 4.0

declare module "path-to-regexp" {
  interface Key {
    name: string | number;
    prefix: string;
    delimiter: string;
    optional: boolean;
    repeat: boolean;
    pattern: string;
  }

  interface Options {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
  }

  interface Match<T> {
    params: T;
    path: string;
  }

  interface MatchFunction<T> {
    (path: string): Match<T> | false;
  }

  function match<T>(path: string, options?: Options): MatchFunction<T>;
  function parse(path: string): Key[];
  function compile(path: string): (params: object) => string;
  function tokensToRegExp(
    tokens: Key[],
    keys?: Key[],
    options?: Options,
  ): RegExp;
  function pathToRegexp(
    path: string | RegExp | Array<string | RegExp>,
    keys?: Key[],
    options?: Options,
  ): RegExp;

  export = pathToRegexp;
}

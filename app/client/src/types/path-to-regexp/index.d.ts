// Type definitions for path-to-regexp 6.3.0
// Project: https://github.com/pillarjs/path-to-regexp
// Definitions by: Devin AI
// Minimum TypeScript Version: 4.0

declare module "path-to-regexp" {
  export interface Key {
    name: string | number;
    prefix: string;
    delimiter: string;
    optional: boolean;
    repeat: boolean;
    pattern: string;
  }

  export interface TokensToRegexpOptions {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
    start?: boolean;
    delimiter?: string;
    endsWith?: string[];
    encode?: (value: string) => string;
  }

  export interface Match<T = any> {
    params: T;
    path: string;
    index?: number;
  }

  export interface MatchFunction<T = any> {
    (path: string): Match<T> | false;
  }

  export function match<T = any>(path: string, options?: TokensToRegexpOptions): MatchFunction<T>;
  export function parse(path: string): Key[];
  export function compile(path: string): (params: object) => string;
  export function tokensToRegexp(tokens: Key[], keys?: Key[], options?: TokensToRegexpOptions): RegExp;
  export function pathToRegexp(path: string | RegExp | Array<string | RegExp>, keys?: Key[], options?: TokensToRegexpOptions): RegExp;

  export default pathToRegexp;
}
}

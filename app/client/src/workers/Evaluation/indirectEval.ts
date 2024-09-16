export default function indirectEval(script: string) {
  // @ts-expect-error We want evaluation to be done only on global scope and shouldn't have access to any local scope variable.
  // Ref. - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#description
  return (1, eval)(script);
}

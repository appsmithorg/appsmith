export default function indirectEval(script: string) {
  /* Indirect eval to prevent local scope access. 
  Ref. - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#description */
  return (1, eval)(script);
}

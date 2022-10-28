/**
 * ellipsis Takes a string and number,
 * if string is longer than a certain length,
 * then it adds ellipsis at the end.
 * @param {string} input
 * @param {number} finalLength Length of the string with ellipsis
 */
export function ellipsis(input: string, finalLength = 24): string {
  const textOnlyLength = finalLength - 3;
  return textOnlyLength < input.length
    ? `${input.slice(0, textOnlyLength).trim()}...`
    : input;
}

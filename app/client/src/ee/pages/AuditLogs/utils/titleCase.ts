/**
 * titleCase takes a string and returns it in the Title case
 * @param {string} input Input
 * @example
 * "is this title case" => "Is this title case"
 * @returns {string} Returns the title cased string.
 */
export function titleCase(input: string): string {
  if (input.length === 0) {
    return "";
  }
  return `${input.slice(0, 1).toUpperCase()}${input.slice(1)}`;
}

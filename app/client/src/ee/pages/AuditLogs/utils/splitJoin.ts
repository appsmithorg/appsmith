/**
 * splitJoin splits a string on splitOn(_) and joins the result of split on joinsOn(space)
 * @param {string} input input string that may or may not contain one or more underscores.
 * @param {string} [splitOn=_] Character(s) to split the string on.
 * @param {string} [joinOn=space] Character(s) to join the string on.
 * @returns {string} the space joined string instead of underscore or same string as it is.
 *
 * @example 1
 * ("a_b_c") => "a b c"
 *
 * @example 2
 * ("a.b_c", ".", " ") => "a b_c"
 */
export function splitJoin(input: string, splitOn = "_", joinOn = " "): string {
  if (input.length === 0) {
    return "";
  }
  return input.split(splitOn).join(joinOn);
}

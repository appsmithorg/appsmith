/**
 * @param {string} search
 * if search stats with a "?" then we only pick first chunk after first ?
 * ELSE if search contains a "?" then we pick first chunk before ?
 * ELSE we pick the whole string
 *
 * @example 1
 * "?emails=test&events=test" => "emails=test&events=test"
 * @example 2
 * "?emails=te?st&events=te?st" => "emails=te"
 * @example 3
 * "emails=te?st&events=te?st" => "emails=te"
 * @example 4
 * "emails=test&events=test" => "emails=test&events=test"
 */
export function sanitiseSearchParamString(search: string) {
  if (search.startsWith("?")) {
    return search.split("?")[1];
  }
  return search.includes("?") ? search.split("?")[0] : search;
}

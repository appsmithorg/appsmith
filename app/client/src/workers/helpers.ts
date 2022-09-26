// Finds the first index which is a duplicate value
// Returns -1 if there are no duplicates
// Returns the index of the first duplicate entry it finds

// Note: This "can" fail if the object entries don't have their properties in the
// same order.
export const findDuplicateIndex = (arr: Array<unknown>) => {
  const _uniqSet = new Set();
  let currSetSize = 0;
  for (let i = 0; i < arr.length; i++) {
    // JSON.stringify because value can be objects
    _uniqSet.add(JSON.stringify(arr[i]));
    if (_uniqSet.size > currSetSize) currSetSize = _uniqSet.size;
    else return i;
  }
  return -1;
};

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 * @param {Number | null} [maxLimit]  Optional. (Default:null)
 */
export const countOccurrences = (
  string: string,
  subString: string,
  allowOverlapping = false,
  maxLimit: number | null = null,
): number => {
  string += "";
  subString += "";
  if (subString.length <= 0) return string.length + 1;

  let n = 0, // count of occurrences
    pos = 0; // current position of the pointer
  const step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      /**
       * If you are only interested in knowing
       * whether occurances count exceeds maxLimit,
       * then break the loop.
       */
      if (maxLimit && n > maxLimit) break;
      pos += step;
    } else break;
  }
  return n;
};

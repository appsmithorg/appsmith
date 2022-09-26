import unescapeJS from 'unescape-js';

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export function sanitizeScript(js: string, evaluationVersion: number) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const trimmedJS = js.replace(beginsWithLineBreakRegex, '');
  return evaluationVersion > 1 ? trimmedJS : unescapeJS(trimmedJS);
}

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (
  item: unknown
): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === '[object Object]';
};

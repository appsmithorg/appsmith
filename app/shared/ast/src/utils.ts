import { has } from 'lodash';
import unescapeJS from 'unescape-js';
import {
  WINDOW_OBJECT_METHODS,
  WINDOW_OBJECT_PROPERTIES,
  GLOBAL_SCOPE_OBJECTS,
  JAVASCRIPT_KEYWORDS,
} from './constants';

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export function sanitizeScript(js: string, evaluationVersion: number) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const trimmedJS = js.replace(beginsWithLineBreakRegex, '');
  return evaluationVersion > 1 ? trimmedJS : unescapeJS(trimmedJS);
}

export function isInvalidEntiyName(name: string) {
  return (
    has(JAVASCRIPT_KEYWORDS, name) ||
    has(GLOBAL_SCOPE_OBJECTS, name) ||
    has(WINDOW_OBJECT_PROPERTIES, name) ||
    has(WINDOW_OBJECT_METHODS, name)
  );
}

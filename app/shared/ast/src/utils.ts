import {
  extraLibrariesNames,
  GLOBAL_FUNCTIONS,
  GLOBAL_WORKER_SCOPE_IDENTIFIERS,
  JAVASCRIPT_KEYWORDS,
} from 'constants/global';
import { has } from 'lodash';
import unescapeJS from 'unescape-js';

const beginsWithLineBreakRegex = /^\s+|\s+$/;

export function sanitizeScript(js: string, evaluationVersion: number) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  const trimmedJS = js.replace(beginsWithLineBreakRegex, '');
  return evaluationVersion > 1 ? trimmedJS : unescapeJS(trimmedJS);
}

/**
 *
 * @param name
 * @returns Checks if an identifier is a valid reference to an entity
 * @example For binding {{function(){  
 * const error = new Error("test error")
 * return error.message
}()}}
Identifier "Error" is not a valid entity reference, as it is part of the identifiers globally available 
in the worker context (where evaluations are done)

 */
export function isInvalidEntityReference(identifier: string) {
  return (
    has(JAVASCRIPT_KEYWORDS, identifier) ||
    has(GLOBAL_WORKER_SCOPE_IDENTIFIERS, identifier) ||
    extraLibrariesNames.includes(identifier) ||
    has(GLOBAL_FUNCTIONS, identifier)
  );
}

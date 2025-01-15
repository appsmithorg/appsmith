import unescapeJS from "unescape-js";
import type { PropertyNode } from "../index";
import { isLiteralNode } from "../index";
//
const beginsWithLineBreakRegex = /^\s+|\s+$/;

export function sanitizeScript(js: string, evaluationVersion: number) {
  // We remove any line breaks from the beginning of the script because that
  // makes the final function invalid. We also unescape any escaped characters
  // so that eval can happen
  //default value of evalutaion version is 2
  evaluationVersion = evaluationVersion ? evaluationVersion : 2;
  const trimmedJS = js.replace(beginsWithLineBreakRegex, "");

  return evaluationVersion > 1 ? trimmedJS : unescapeJS(trimmedJS);
}

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (
  item: unknown,
): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

export const getNameFromPropertyNode = (node: PropertyNode): string =>
  isLiteralNode(node.key) ? String(node.key.value) : node.key.name;

interface Position {
  line: number;
  ch: number;
}

export const extractContentByPosition = (
  content: string,
  position: { from: Position; to: Position },
) => {
  const eachLine = content.split("\n");

  let returnedString = "";

  for (let i = position.from.line; i <= position.to.line; i++) {
    if (i === position.from.line) {
      returnedString =
        position.from.line !== position.to.line
          ? eachLine[position.from.line].slice(position.from.ch)
          : eachLine[position.from.line].slice(
              position.from.ch,
              position.to.ch + 1,
            );
    } else if (i === position.to.line) {
      returnedString += eachLine[position.to.line].slice(0, position.to.ch + 1);
    } else {
      returnedString += eachLine[i];
    }

    if (i !== position.to.line) {
      returnedString += "\n";
    }
  }

  return returnedString;
};

export const getStringValue = (
  inputValue: string | number | boolean | RegExp,
) => {
  if (typeof inputValue === "object" || typeof inputValue === "boolean") {
    inputValue = JSON.stringify(inputValue);
  } else if (typeof inputValue === "number" || typeof inputValue === "string") {
    inputValue += "";
  }

  return inputValue;
};

import { FUNC_ARGS_REGEX } from "./regex";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { isValidURL } from "utils/URLUtils";
import {
  getTextArgumentAtPosition,
  getEnumArgumentAtPosition,
  getModalName,
  setModalName,
  setTextArgumentAtPosition,
  setEnumArgumentAtPosition,
} from "@shared/ast";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  return stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(" + ");
};

export const JSToString = (js: string): string => {
  const segments = js.split(" + ");
  return segments
    .map((segment) => {
      if (segment.charAt(0) === "'") {
        return segment.substring(1, segment.length - 1);
      } else return "{{" + segment + "}}";
    })
    .join("");
};

export const argsStringToArray = (funcArgs: string): string[] => {
  const argsplitMatches = [...funcArgs.matchAll(FUNC_ARGS_REGEX)];
  const arr: string[] = [];
  let isPrevUndefined = true;
  for (const match of argsplitMatches) {
    const matchVal = match[0];
    if (!matchVal || matchVal === "") {
      if (isPrevUndefined) {
        arr.push(matchVal);
      }
      isPrevUndefined = true;
    } else {
      isPrevUndefined = false;
      arr.push(matchVal);
    }
  }
  return arr;
};

export const modalSetter = (changeValue: any, currentValue: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  console.log("* modalsetter", changeValue, currentValue);
  const requiredValue = getDynamicBindings(currentValue).jsSnippets[0];
  console.log(setModalName(requiredValue, changeValue, self.evaluationVersion));
  return setModalName(requiredValue, changeValue, self.evaluationVersion);
};

export const modalGetter = (value: string) => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  console.log("* modalgetter", value);
  const requiredValue = getDynamicBindings(value).jsSnippets[0];
  console.log("* requiredval", requiredValue);
  return getModalName(requiredValue, self.evaluationVersion);
};

export const textSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(currentValue).jsSnippets[0];
  return setTextArgumentAtPosition(
    requiredValue,
    changeValue,
    argNum,
    self.evaluationVersion,
  );
};

export const textGetter = (value: string, argNum: number): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(value).jsSnippets[0];
  return getTextArgumentAtPosition(
    requiredValue,
    argNum,
    self.evaluationVersion,
  );
};

export const enumTypeSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(currentValue).jsSnippets[0];
  return setEnumArgumentAtPosition(
    requiredValue,
    changeValue,
    argNum,
    self.evaluationVersion,
  );
};

export const enumTypeGetter = (
  value: string,
  argNum: number,
  defaultValue = "",
): string => {
  // requiredValue is value minus the surrounding {{ }}
  // eg: if value is {{download()}}, requiredValue = download()
  const requiredValue = getDynamicBindings(value).jsSnippets[0];
  return getEnumArgumentAtPosition(
    requiredValue,
    argNum,
    defaultValue,
    self.evaluationVersion,
  );
};

/*
 * This function extracts the 1st string argument from value
 * and determines if the string is a valid url
 */
export const isValueValidURL = (value: string) => {
  if (value) {
    const indices = [];
    for (let i = 0; i < value.length; i++) {
      if (value[i] === "'") {
        indices.push(i);
      }
    }
    const str = value.substring(indices[0], indices[1] + 1);
    return isValidURL(str);
  }
};

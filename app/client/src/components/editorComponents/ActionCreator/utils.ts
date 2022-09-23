import {
  ACTION_TRIGGER_REGEX,
  FUNC_ARGS_REGEX,
  IS_URL_OR_MODAL,
} from "./regex";
import {
  getDynamicBindings,
  isDynamicValue,
} from "../../../utils/DynamicBindingUtils";

export const stringToJS = (string: string): string => {
  const { jsSnippets, stringSegments } = getDynamicBindings(string);
  const js = stringSegments
    .map((segment, index) => {
      if (jsSnippets[index] && jsSnippets[index].length > 0) {
        return jsSnippets[index];
      } else {
        return `'${segment}'`;
      }
    })
    .join(" + ");
  return js;
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
  argsplitMatches.forEach((match) => {
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
  });
  return arr;
};

export const modalSetter = (changeValue: any, currentValue: string) => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = matches[0][2].split(",");
    if (isDynamicValue(changeValue)) {
      args[0] = `${changeValue.substring(2, changeValue.length - 2)}`;
    } else {
      args[0] = `'${changeValue}'`;
    }
  }
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};

export const modalGetter = (value: string) => {
  console.log("111", value);
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  let name = "none";
  if (matches.length) {
    const modalName = matches[0][2].split(",")[0];
    if (IS_URL_OR_MODAL.test(modalName) || modalName === "") {
      name = modalName.substring(1, modalName.length - 1);
    } else {
      name = `{{${modalName}}}`;
    }
  }
  return name;
};

export const textSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = argsStringToArray(matches[0][2]);
    const jsVal = stringToJS(changeValue);
    args[argNum] = jsVal;
  }
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

export const textGetter = (value: string, argNum: number) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const args = argsStringToArray(matches[0][2]);
    const arg = args[argNum];
    const stringFromJS = arg ? JSToString(arg.trim()) : arg;
    return stringFromJS;
  }
  return "";
};

export const enumTypeSetter = (
  changeValue: any,
  currentValue: string,
  argNum: number,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  let args: string[] = [];
  if (matches.length) {
    args = argsStringToArray(matches[0][2]);
    args[argNum] = changeValue as string;
  }
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

export const enumTypeGetter = (
  value: string,
  argNum: number,
  defaultValue = "",
): string => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const args = argsStringToArray(matches[0][2]);
    const arg = args[argNum];
    return arg ? arg.trim() : defaultValue;
  }
  return defaultValue;
};

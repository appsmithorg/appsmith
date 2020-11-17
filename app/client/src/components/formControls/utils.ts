import { isBoolean, get } from "lodash";
import { HiddenType } from "./BaseControl";

export const isHidden = (values: any, hiddenConfig?: HiddenType) => {
  if (!!hiddenConfig && !isBoolean(hiddenConfig)) {
    const valueAtPath = get(values, hiddenConfig.path);
    const value = hiddenConfig.value;

    switch (hiddenConfig.comparison) {
      case "EQUALS":
        return valueAtPath === value;
      case "NOT_EQUALS":
        return valueAtPath !== value;
      case "GREATER":
        return valueAtPath > value;
      case "LESSER":
        return valueAtPath < value;
      default:
        return true;
    }
  }

  return !!hiddenConfig;
};

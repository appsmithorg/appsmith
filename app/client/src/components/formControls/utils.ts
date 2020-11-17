import _ from "lodash";
import { ComparisonOperations, HiddenType } from "./BaseControl";

export const isHidden = (values: any, hiddenConfig?: HiddenType) => {
  if (!!hiddenConfig && !_.isBoolean(hiddenConfig)) {
    const valueAtPath = _.get(values, hiddenConfig.path);
    const value = hiddenConfig.value;

    switch (hiddenConfig.comparison) {
      case ComparisonOperations.EQUALS:
        return valueAtPath === value;
      case ComparisonOperations.NOT_EQUALS:
        return valueAtPath !== value;
      case ComparisonOperations.GREATER:
        return valueAtPath > value;
      case ComparisonOperations.LESSER:
        return valueAtPath < value;
      default:
        return true;
    }
  }

  return !!hiddenConfig;
};

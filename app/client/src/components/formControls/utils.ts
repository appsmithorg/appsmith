import { isBoolean, get, map, set } from "lodash";
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

export const getConfigInitialValues = (config: Record<string, any>[]) => {
  const configInitialValues = {};
  const parseConfig = (section: any): any => {
    return map(section.children, (subSection: any) => {
      if ("children" in subSection) {
        return parseConfig(subSection);
      }

      if (subSection.initialValue) {
        if (subSection.controlType === "KEYVALUE_ARRAY") {
          subSection.initialValue.forEach(
            (initialValue: string | number, index: number) => {
              const configProperty = subSection.configProperty.replace(
                "*",
                index,
              );

              set(configInitialValues, configProperty, initialValue);
            },
          );
        } else {
          set(
            configInitialValues,
            subSection.configProperty,
            subSection.initialValue,
          );
        }
      }
    });
  };

  config.forEach((section: any) => {
    parseConfig(section);
  });

  return configInitialValues;
};

import { Action } from "entities/Action/index";
import _ from "lodash";

export const getBindingPathsOfAction = (
  action: Action,
  formConfig?: any[],
): Record<string, true> => {
  const bindingPaths: Record<string, true> = {
    data: true,
    isLoading: true,
  };
  if (!formConfig) {
    return {
      ...bindingPaths,
      config: true,
    };
  }
  const recursiveFindBindingPaths = (formConfig: any) => {
    if (formConfig.children) {
      formConfig.children.forEach(recursiveFindBindingPaths);
    } else {
      const configPath = formConfig.configProperty.replace(
        "actionConfiguration.",
        "config.",
      );
      if (
        ["QUERY_DYNAMIC_TEXT", "QUERY_DYNAMIC_INPUT_TEXT"].includes(
          formConfig.controlType,
        )
      ) {
        bindingPaths[configPath] = true;
      }
      if (formConfig.controlType === "ARRAY_FIELD") {
        debugger;
        const actionValue = _.get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          for (let i = 0; i < actionValue.length; i++) {
            formConfig.schema.forEach((schemaField: any) => {
              const arrayConfigPath = `${configPath}[${i}].${schemaField.key}`;
              bindingPaths[arrayConfigPath] = true;
            });
          }
        }
      }
    }
  };

  formConfig.forEach(recursiveFindBindingPaths);

  return bindingPaths;
};

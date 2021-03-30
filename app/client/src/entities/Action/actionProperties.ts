import { Action } from "entities/Action/index";
import _ from "lodash";

const dynamicFields = ["QUERY_DYNAMIC_TEXT", "QUERY_DYNAMIC_INPUT_TEXT"];

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
      if (dynamicFields.includes(formConfig.controlType)) {
        bindingPaths[configPath] = true;
      }
      if (formConfig.controlType === "ARRAY_FIELD") {
        const actionValue = _.get(action, formConfig.configProperty);
        if (Array.isArray(actionValue)) {
          for (let i = 0; i < actionValue.length; i++) {
            formConfig.schema.forEach((schemaField: any) => {
              if (
                schemaField.key in actionValue[i] &&
                dynamicFields.includes(schemaField.controlType)
              ) {
                const arrayConfigPath = `${configPath}[${i}].${schemaField.key}`;
                bindingPaths[arrayConfigPath] = true;
              }
            });
          }
        }
      }
    }
  };

  formConfig.forEach(recursiveFindBindingPaths);

  return bindingPaths;
};

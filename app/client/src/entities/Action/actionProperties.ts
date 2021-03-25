import { Action } from "entities/Action/index";

export const getBindingPathsOfAction = (
  action: Action,
  formConfig?: any[],
): Record<string, true> => {
  const bindingPaths: Record<string, true> = {
    data: true,
    isLoading: true,
  };
  debugger;
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
    }
  };

  formConfig.forEach(recursiveFindBindingPaths);

  return bindingPaths;
};

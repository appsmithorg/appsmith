import { Action } from "entities/Action";

//Fix for where clause issue: add missing where key in the action.config.pluginSpecifiedTemplates
//Required for queries in edit mode
//Called on Update Action
export function fixMissingWhereKey(
  actionObject: Action | undefined,
): Action | undefined {
  if (!actionObject) return undefined;

  const fixedActionObject = {
    ...actionObject,
    pluginSpecifiedTemplates: actionObject.actionConfiguration.pluginSpecifiedTemplates.map(
      (template: { key: string; value: any }) => {
        if (template && template.value && !template.key) {
          template["key"] = "where";
        }
        return template;
      },
    ),
  };
  return fixedActionObject;
}

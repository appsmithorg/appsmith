import { UIComponentTypes, Plugin } from "api/PluginApi";

export const getUIComponent = (pluginId: string, allPlugins: Plugin[]) => {
  let uiComponent = UIComponentTypes.DbEditorForm;

  if (!!pluginId) {
    // Adding uiComponent field to switch form type to UQI or allow for backward compatibility
    const plugin = allPlugins.find((plugin: Plugin) =>
      !!pluginId ? plugin.id === pluginId : false,
    );
    // Defaults to old value, new value can be DBEditorForm or UQIDBEditorForm
    if (plugin) {
      uiComponent = plugin.uiComponent;
    }
  }
  return uiComponent;
};

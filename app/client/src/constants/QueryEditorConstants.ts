import { PluginPackageName } from "entities/Action";

export const QUERY_BODY_FIELDS = [
  "actionConfiguration.body",
  "actionConfiguration.formData.body.data",
];

export const PLUGIN_PACKAGE_DBS = [
  PluginPackageName.POSTGRES,
  PluginPackageName.MONGO,
];

export enum EDITOR_TABS {
  QUERY = "QUERY",
  SETTINGS = "SETTINGS",
}

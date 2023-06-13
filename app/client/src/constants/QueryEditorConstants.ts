import { PluginPackageName, PluginName } from "entities/Action";

export const QUERY_BODY_FIELDS = [
  "actionConfiguration.body",
  "actionConfiguration.formData.body.data",
];

export const SQL_DATASOURCES: Array<string> = [
  PluginName.POSTGRES,
  PluginName.MS_SQL,
  PluginName.MY_SQL,
  PluginName.ORACLE,
  PluginName.SNOWFLAKE,
  PluginName.ARANGODB,
  PluginName.REDSHIFT,
];

export const PLUGIN_PACKAGE_DBS = [
  PluginPackageName.POSTGRES,
  PluginPackageName.MONGO,
];

export enum EDITOR_TABS {
  QUERY = "QUERY",
  SETTINGS = "SETTINGS",
}

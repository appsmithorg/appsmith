import { PluginName, PluginPackageName } from "entities/Plugin";

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

export const DATASOURCES_ALLOWED_FOR_PREVIEW_MODE: Array<string> = [
  PluginName.POSTGRES,
  PluginName.MY_SQL,
];

export const PLUGIN_PACKAGE_DBS = [
  PluginPackageName.POSTGRES,
  PluginPackageName.MONGO,
];

export const MOCK_DB_TABLE_NAMES = {
  MOVIES: "movies",
  USERS: "public.users",
};

export enum EDITOR_TABS {
  QUERY = "QUERY",
  SETTINGS = "SETTINGS",
}

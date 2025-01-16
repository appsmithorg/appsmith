export enum PluginType {
  API = "API",
  DB = "DB",
  SAAS = "SAAS",
  JS = "JS",
  REMOTE = "REMOTE",
  AI = "AI",
  INTERNAL = "INTERNAL",
  EXTERNAL_SAAS = "EXTERNAL_SAAS",
}

export enum PluginPackageName {
  POSTGRES = "postgres-plugin",
  MONGO = "mongo-plugin",
  S3 = "amazons3-plugin",
  GOOGLE_SHEETS = "google-sheets-plugin",
  FIRESTORE = "firestore-plugin",
  REST_API = "restapi-plugin",
  GRAPHQL = "graphql-plugin",
  JS = "js-plugin",
  ORACLE = "oracle-plugin",
  MY_SQL = "mysql-plugin",
  MS_SQL = "mssql-plugin",
  SNOWFLAKE = "snowflake-plugin",
  APPSMITH_AI = "appsmithai-plugin",
  WORKFLOW = "workflow-plugin",
}

// more can be added subsequently.
export enum PluginName {
  MONGO = "MongoDB",
  POSTGRES = "PostgreSQL",
  MY_SQL = "MySQL",
  MS_SQL = "Microsoft SQL Server",
  GOOGLE_SHEETS = "Google Sheets",
  FIRESTORE = "Firestore",
  ORACLE = "Oracle",
  SNOWFLAKE = "Snowflake",
  ARANGODB = "ArangoDB",
  REDSHIFT = "Redshift",
  SMTP = "SMTP",
  REST_API = "REST API",
  REDIS = "Redis",
  AIRTABLE = "Airtable",
  TWILIO = "Twilio",
  HUBSPOT = "HubSpot",
  ELASTIC_SEARCH = "Elasticsearch",
  GRAPHQL = "Authenticated GraphQL API",
  OPEN_AI = "Open AI",
  APPSMITH_AI = "Appsmith AI",
}

export type PluginId = string;
export type GenerateCRUDEnabledPluginMap = Record<PluginId, PluginPackageName>;

export enum UIComponentTypes {
  DbEditorForm = "DbEditorForm",
  UQIDbEditorForm = "UQIDbEditorForm",
  ApiEditorForm = "ApiEditorForm",
  JsEditorForm = "JsEditorForm",
  GraphQLEditorForm = "GraphQLEditorForm",
}

export enum DatasourceComponentTypes {
  RestAPIDatasourceForm = "RestAPIDatasourceForm",
  AutoForm = "AutoForm",
}

export interface Plugin {
  id: string;
  name: string;
  type: PluginType;
  packageName: PluginPackageName;
  iconLocation?: string;
  uiComponent: UIComponentTypes;
  datasourceComponent: DatasourceComponentTypes;
  allowUserDatasources?: boolean;
  templates: Record<string, string>;
  responseType?: "TABLE" | "JSON";
  documentationLink?: string;
  generateCRUDPageComponent?: string;
  // We need to know if the plugin requires a datasource (Eg Workflows plugin does not require a datasource to create queries)
  requiresDatasource: boolean;
}

export interface DefaultPlugin {
  id: string;
  name: string;
  packageName: string;
  iconLocation?: string;
  allowUserDatasources?: boolean;
}

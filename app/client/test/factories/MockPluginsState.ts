import type { PluginDataState } from "reducers/entityReducers/pluginsReducer";
import { PluginPackageName } from "entities/Plugin";

export const PluginIDs: Record<PluginPackageName, string> = {
  [PluginPackageName.POSTGRES]: "65e58df196506a506bd7069c",
  [PluginPackageName.REST_API]: "65e58df196506a506bd7069d",
  [PluginPackageName.MONGO]: "65e58df196506a506bd7069e",
  [PluginPackageName.GOOGLE_SHEETS]: "65e58df296506a506bd706a9",
  [PluginPackageName.JS]: "65e58df296506a506bd706ad",
  [PluginPackageName.MY_SQL]: "65e58df296506a506bd7069f",
  [PluginPackageName.S3]: "65e58df296506a506bd706a8",
  [PluginPackageName.SNOWFLAKE]: "65e58df296506a506bd706ab",
  [PluginPackageName.FIRESTORE]: "65e58df296506a506bd706a6",
  [PluginPackageName.GRAPHQL]: "65e58df396506a506bd706be",
  [PluginPackageName.APPSMITH_AI]: "65e58fe2225bee69e71c536a",
  [PluginPackageName.MS_SQL]: "65e58df296506a506bd706a5",
  [PluginPackageName.ORACLE]: "65e58df396506a506bd706bf",
  [PluginPackageName.WORKFLOW]: "<replace-me-with-default-plugin-id>", // this is added for the typing of PluginIDs to pass
};

export default {
  list: [
    {
      id: "65e58df196506a506bd7069c",
      userPermissions: [],
      name: "PostgreSQL",
      type: "DB",
      packageName: "postgres-plugin",
      iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "PostgreSQL",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );",
        SELECT:
          "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN",
        UPDATE:
          "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};\n",
        DELETE: "DELETE FROM users WHERE id = -1;",
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df196506a506bd7069d",
      userPermissions: [],
      name: "REST API",
      type: "API",
      packageName: "restapi-plugin",
      iconLocation: "https://assets.appsmith.com/RestAPI.png",
      uiComponent: "ApiEditorForm",
      datasourceComponent: "RestAPIDatasourceForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df196506a506bd7069e",
      userPermissions: [],
      name: "MongoDB",
      type: "DB",
      packageName: "mongo-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mongodb.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-mongodb#create-queries",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "MongoDB",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          '{\n  "insert": "users",\n  "documents": [\n    {\n      "name": "{{ nameInput.text }}",\n      "email": "{{ emailInput.text }}",\n      "gender": "{{ genderDropdown.selectedOptionValue }}"\n    }\n  ]\n}\n',
        READ: '{\n  "find": "users",\n  "filter": {\n    "status": "{{ statusDropdown.selectedOptionValue }}"\n  },\n  "sort": {\n    "id": 1\n  },\n  "limit": 10\n}',
        UPDATE:
          '{\n  "update": "users",\n  "updates": [\n    {\n      "q": {\n        "id": 10\n      },\n      "u": { "$set": { "status": "{{ statusDropdown.selectedOptionValue }}" } }\n    }\n  ]\n}\n',
        DELETE:
          '{\n  "delete": "users",\n  "deletes": [\n    {\n      "q": {\n        "id": "{{ usersTable.selectedRow.id }}"\n      },\n      "limit": 1\n    }\n  ]\n}\n',
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd7069f",
      userPermissions: [],
      name: "MySQL",
      type: "DB",
      packageName: "mysql-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mysql.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-mysql#create-queries",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "SQL",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );",
        SELECT:
          "SELECT * FROM <<your_table_name>> LIMIT 10\n\n-- Please enter a valid table name and hit RUN\n",
        UPDATE:
          "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};",
        DELETE: "DELETE FROM users WHERE id = -1;",
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a2",
      userPermissions: [],
      name: "Elasticsearch",
      type: "DB",
      packageName: "elasticsearch-plugin",
      iconLocation: "https://assets.appsmith.com/logo/elastic.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-elasticsearch#querying-elasticsearch",
      responseType: "JSON",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a3",
      userPermissions: [],
      name: "DynamoDB",
      type: "DB",
      packageName: "dynamo-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-dynamodb.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-dynamodb#create-queries",
      responseType: "JSON",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a4",
      userPermissions: [],
      name: "Redis",
      type: "DB",
      packageName: "redis-plugin",
      iconLocation: "https://assets.appsmith.com/logo/redis.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-redis#querying-redis",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a5",
      userPermissions: [],
      name: "Microsoft SQL Server",
      type: "DB",
      packageName: "mssql-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mssql.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-mssql#create-queries",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "SQL",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );\n",
        SELECT:
          "SELECT TOP 10 * FROM <<your_table_name>>;\n\n-- Please enter a valid table name and hit RUN",
        UPDATE:
          "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};\n",
        DELETE:
          "DELETE FROM users WHERE id = {{ usersTable.selectedRow.id }};\n",
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a6",
      userPermissions: [],
      name: "Firestore",
      type: "DB",
      packageName: "firestore-plugin",
      iconLocation: "https://assets.appsmith.com/logo/firestore.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-firestore#understanding-commands",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a7",
      userPermissions: [],
      name: "Redshift",
      type: "DB",
      packageName: "redshift-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-redshift.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-redshift#querying-redshift",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "SQL",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a8",
      userPermissions: [],
      name: "S3",
      type: "DB",
      packageName: "amazons3-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-s3.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-amazon-s3#list-files",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "S3",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706a9",
      userPermissions: [],
      name: "Google Sheets",
      type: "SAAS",
      packageName: "google-sheets-plugin",
      pluginName: "google-sheets-plugin",
      iconLocation: "https://assets.appsmith.com/GoogleSheets.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-google-sheets#create-queries",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "OAuth2DatasourceForm",
      generateCRUDPageComponent: "Google Sheets",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706ab",
      userPermissions: [],
      name: "Snowflake",
      type: "DB",
      packageName: "snowflake-plugin",
      iconLocation: "https://assets.appsmith.com/logo/snowflake.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-snowflake-db#querying-snowflake",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      generateCRUDPageComponent: "SQL",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    '{{ nameInput.text }}',\n    '{{ genderDropdown.selectedOptionValue }}',\n    '{{ emailInput.text }}'\n  );",
        SELECT:
          "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN",
        UPDATE:
          "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = '{{ usersTable.selectedRow.id }}';",
        DELETE: "DELETE FROM users WHERE id = -1;",
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706ac",
      userPermissions: [],
      name: "ArangoDB",
      type: "DB",
      packageName: "arangodb-plugin",
      iconLocation: "https://assets.appsmith.com/logo/arangodb.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-arango-db#using-queries-in-applications",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        CREATE:
          'INSERT {\n    name: "{{ nameInput.text }}",\n    gender: "{{ genderDropdown.selectedOptionValue }}",\n    email: "{{ emailInput.text }}"\n} INTO users\n\n// nameInput and genderDropdown are example widgets, replace them with your widget names. To understand more please\n// check out: https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
        SELECT:
          'FOR user IN users\nFILTER user.role == "Admin"\nSORT user.id ASC\nLIMIT 10\nRETURN user\n\n// Use widget data in a query using {{ widgetName.property }}. To understand more, please check out:\n// https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
        UPDATE:
          'UPDATE\n"{{ usersTable.selectedRow.id }}"\nWITH\n{\n    status: "APPROVED"\n}\nIN users\n\n// usersTable is an example table widget from where the id is being read. Replace it with your own Table widget or a\n// static value. To understand more please check out: https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
        DELETE:
          'REMOVE "1" IN users\n\n// Use widget data in a query by replacing static values with {{ widgetName.property }}. To understand more please\n// check out https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706ad",
      userPermissions: [],
      name: "JS Functions",
      type: "JS",
      packageName: "js-plugin",
      iconLocation: "https://assets.appsmith.com/js-yellow.svg",
      documentationLink:
        "https://docs.appsmith.com/v/v1.2.1/js-reference/using-js",
      responseType: "JSON",
      uiComponent: "JsEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df296506a506bd706ae",
      userPermissions: [],
      name: "SMTP",
      type: "DB",
      packageName: "smtp-plugin",
      iconLocation: "https://assets.appsmith.com/smtp-icon.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/using-smtp",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706be",
      userPermissions: [],
      name: "Authenticated GraphQL API",
      type: "API",
      packageName: "graphql-plugin",
      iconLocation:
        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/graphql#create-queries",
      responseType: "JSON",
      uiComponent: "GraphQLEditorForm",
      datasourceComponent: "RestAPIDatasourceForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706bf",
      userPermissions: [],
      name: "Oracle",
      type: "DB",
      packageName: "oracle-plugin",
      iconLocation:
        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/querying-oracle#create-queries",
      responseType: "TABLE",
      uiComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {
        SELECT:
          "SELECT* FROM <<your_table_name>> WHERE ROWNUM < 10;\n\n-- Please enter a valid table name and hit RUN\n",
        INSERT:
          "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  )",
        UPDATE:
          "UPDATE users SET status = 'APPROVED' WHERE id = {{ usersTable.selectedRow.id }}",
        DELETE: "DELETE FROM users WHERE id = {{idInput.text}}",
      },
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706c1",
      userPermissions: [],
      name: "Open AI",
      type: "AI",
      packageName: "openai-plugin",
      pluginName: "Open AI",
      iconLocation: "https://assets.appsmith.com/logo/open-ai.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/open-ai",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706c2",
      userPermissions: [],
      name: "Anthropic",
      type: "AI",
      packageName: "anthropic-plugin",
      pluginName: "Anthropic",
      iconLocation: "https://assets.appsmith.com/logo/anthropic.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/anthropic",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706c3",
      userPermissions: [],
      name: "Google AI",
      type: "AI",
      packageName: "googleai-plugin",
      pluginName: "Google AI",
      iconLocation: "https://assets.appsmith.com/google-ai.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/google-ai",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706c4",
      userPermissions: [],
      name: "Databricks",
      type: "DB",
      packageName: "databricks-plugin",
      pluginName: "Databricks",
      iconLocation: "https://assets.appsmith.com/databricks-logo.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/databricks",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58df396506a506bd706c5",
      userPermissions: [],
      name: "AWS Lambda",
      type: "REMOTE",
      packageName: "aws-lambda-plugin",
      pluginName: "AWS Lambda",
      iconLocation: "https://assets.appsmith.com/aws-lambda-logo.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/aws-lambda",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      isRemotePlugin: false,
      templates: {},
      remotePlugin: false,
      new: false,
      requiresDatasource: true,
    },
    {
      id: "65e58e1296506a506bd706c6",
      userPermissions: [],
      name: "HubSpot",
      type: "REMOTE",
      packageName: "saas-plugin",
      pluginName: "hubspot-1.2-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/hubspot.png",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/hubspot#create-queries",
      responseType: "JSON",
      version: "1.0",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: true,
      requiresDatasource: true,
      actionUiConfig: {
        editor: [
          {
            label: "Command",
            description: "Select the method to run",
            configProperty: "actionConfiguration.formData.command",
            controlType: "DROP_DOWN",
            options: [
              {
                index: 1,
                label: "HubDB - get published tables",
                value: "GET_PUBLISHED_TABLES",
              },
              {
                index: 2,
                label: "HubDB - create table",
                value: "CREATE_TABLE",
              },
              {
                index: 3,
                label: "HubDB - get details of a published table",
                value: "GET_DETAILS_PUBLISHED_TABLE",
              },
              {
                index: 4,
                label: "HubDB - archive table",
                value: "ARCHIVE_TABLE",
              },
              {
                index: 5,
                label: "HubDB - update existing table",
                value: "UPDATE_EXISTING_TABLE",
              },
              {
                index: 6,
                label: "HubDB - clone table",
                value: "CLONE_TABLE",
              },
              {
                index: 7,
                label: "HubDB - export published version table",
                value: "EXPORT_PUBLISHED_VERSION_TABLE",
              },
              {
                index: 8,
                label: "HubDB - unpublish table",
                value: "UNPUBLISH_TABLE",
              },
              {
                index: 9,
                label: "HubDB - get table rows",
                value: "GET_ROWS_TABLE",
              },
              {
                index: 10,
                label: "HubDB - add new table row",
                value: "ADD_NEW_ROW_TABLE",
              },
              {
                index: 11,
                label: "HubDB - get table row",
                value: "GET_TABLE_ROW",
              },
              {
                index: 12,
                label: "HubDB - update existing row",
                value: "UPDATE_EXISTING_ROW",
              },
              {
                index: 13,
                label: "HubDB - replace existing row",
                value: "REPLACE_EXISTING_ROW",
              },
              {
                index: 14,
                label: "HubDB - permanently delete row",
                value: "PERMANENTLY_DELETE_A_ROW",
              },
              {
                index: 15,
                label: "HubDB - clone row",
                value: "CLONE_ROW",
              },
              {
                index: 16,
                label: "HubDB - get set rows",
                value: "GET_SET_ROWS",
              },
              {
                index: 17,
                label: "HubDB - permanently delete rows",
                value: "PERMANENTLY_DELETE_ROWS",
              },
              {
                index: 18,
                label: "Domains - get current domains",
                value: "GET_CURRENT_DOMAINS",
              },
              {
                index: 19,
                label: "Domains - get single domain",
                value: "GET_SINGLE_DOMAINS",
              },
              {
                index: 20,
                label: "URL redirects - get current redirects",
                value: "GET_CURRENT_REDIRECTS",
              },
              {
                index: 21,
                label: "URL redirects - create redirect",
                value: "CREATE_A_REDIRECT",
              },
              {
                index: 22,
                label: "URL redirects - get details redirect",
                value: "GET_DETAILS_FOR_A_REDIRECT",
              },
              {
                index: 23,
                label: "URL redirects - update redirect",
                value: "UPDATE_A_REDIRECT",
              },
              {
                index: 24,
                label: "URL redirects - delete redirect",
                value: "DELETE_A_REDIRECT",
              },
              {
                index: 25,
                label: "CRM - list objects",
                value: "LIST_OBJECTS",
              },
              {
                index: 26,
                label: "CRM - create object",
                value: "CREATE_OBJECT",
              },
              {
                index: 27,
                label: "CRM - read object",
                value: "READ_OBJECT",
              },
              {
                index: 28,
                label: "CRM - update object",
                value: "UPDATE_OBJECT",
              },
              {
                index: 29,
                label: "CRM - archive object",
                value: "ARCHIVE_OBJECT",
              },
              {
                index: 30,
                label: "CRM - search object",
                value: "SEARCH_OBJECT",
              },
              {
                index: 31,
                label: "CRM - GDPR delete",
                value: "GDPR_DELETE",
              },
              {
                index: 32,
                label: "Files - import file",
                value: "IMPORT_FILE",
              },
              {
                index: 33,
                label: "Files - delete file",
                value: "DELETE_FILE",
              },
              {
                index: 34,
                label: "Files - get file",
                value: "GET_FILE",
              },
              {
                index: 35,
                label: "Files - create folder",
                value: "CREATE_FOLDER",
              },
              {
                index: 36,
                label: "Files - search file",
                value: "SEARCH_FILE",
              },
              {
                index: 38,
                label: "Files - search folder",
                value: "SEARCH_FOLDERS",
              },
              {
                index: 39,
                label: "Files - update folder properties",
                value: "UPDATE_FOLDER_PROPERTIES",
              },
              {
                index: 40,
                label: "Files - check folder update status",
                value: "CHECK_FOLDER_UPDATE_STATUS",
              },
              {
                index: 41,
                label: "Files - get folder",
                value: "GET_FOLDER",
              },
              {
                index: 42,
                label: "Files - delete folder",
                value: "DELETE_FOLDER",
              },
              {
                index: 43,
                label: "Settings - retrieve list of users",
                value: "RETRIEVE_LIST_USERS",
              },
              {
                index: 44,
                label: "Settings - add user",
                value: "ADD_USER",
              },
              {
                index: 45,
                label: "Settings - retrieve user",
                value: "RETRIEVES_USER",
              },
              {
                index: 46,
                label: "Settings - modify user",
                value: "MODIFY_USER",
              },
              {
                index: 47,
                label: "Settings - remove user",
                value: "REMOVES_USER",
              },
              {
                index: 48,
                label: "Settings - retrieve roles account",
                value: "RETRIEVES_ROLES_ACCOUNT",
              },
              {
                index: 49,
                label: "Settings - see details account's teams",
                value: "SEE_DETAILS_ACCOUNT'S_TEAMS",
              },
            ],
          },
          {
            identifier: "ARCHIVE_OBJECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Object type",
                configProperty: "actionConfiguration.formData.objectType",
                isRequired: true,
                requiresEncoding: true,
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.).",
                subtitle: "Valid object type for the CRM.",
                placeholderText: "contacts",
              },
              {
                configProperty: "actionConfiguration.formData.objectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectId",
                label: "Object ID",
                isRequired: true,
                tooltipText:
                  "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                subtitle: "Identifier of the object. ",
                placeholderText: "201",
              },
            ],
            name: "Archive object",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'ARCHIVE_OBJECT'}}",
            },
          },
          {
            identifier: "UPDATE_EXISTING_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "archived",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
                subtitle: "Whether to return only archived results.",
                placeholderText: "false",
                label: "Archived",
                configProperty: "actionConfiguration.formData.archived",
                initialValue: "false",
              },
              {
                configProperty: "actionConfiguration.formData.inludeForeignIds",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "inludeForeignIds",
                label: "Include foreign IDs",
                placeholderText: "false",
                subtitle: "If true, populate foreign ID values in the result. ",
                tooltipText:
                  "Set this to true  to populate foreign ID values in the result. Defaults to false.",
                initialValue: "false",
              },
              {
                configProperty: "actionConfiguration.formData.tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableIdOrName",
                label: "Table ID or name",
                placeholderText: "test_table",
                subtitle: "Table name or ID of the table to update. ",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                isRequired: true,
                label: "Name",
                requiresEncoding: false,
                subtitle: "Name of the resulting table.",
                tooltipText: "Name that will be used to identify the table.",
                placeholderText: "test_table",
              },
              {
                configProperty: "actionConfiguration.formData.label",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "label",
                label: "Label",
                placeholderText: "Test table",
                requiresEncoding: false,
                subtitle: "Label of the resulting table. ",
                tooltipText: "Label to represent the table name.",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.useForPages",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "useForPages",
                initialValue: "false",
                label: "Use for pages",
                placeholderText: "false",
                subtitle:
                  "If true, the table can be used for creation of dynamic pages. ",
                tooltipText:
                  "The table can be used for creation of dynamic pages. Default value: false",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.columns",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "columns",
                label: "Columns",
                subtitle: "List of columns in the table.",
                tooltipText:
                  "List of columns in the table. Refer Hubspot documentation to create the columns, all column fields are required (id, name, label, type, options). in options you can add multi-columns. type: array",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty:
                  "actionConfiguration.formData.allowPublicApiAccess",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "allowPublicApiAccess",
                initialValue: "false",
                label: "Allow public API access",
                placeholderText: "false",
                subtitle:
                  "If true, the table can be read by public without authorization.",
                tooltipText:
                  "The table can be read by public without authorization. Default value: false",
              },
              {
                configProperty: "actionConfiguration.formData.allowChildTables",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "allowChildTables",
                initialValue: "false",
                label: "Allow child tables",
                placeholderText: "false",
                subtitle: "If true, the child tables can be created. ",
                tooltipText:
                  "Whether child tables can be created. Default value:false",
              },
              {
                configProperty:
                  "actionConfiguration.formData.enableChildTablePages",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "enableChildTablePages",
                initialValue: "false",
                label: "Enable child table pages",
                placeholderText: "false",
                subtitle:
                  "If true, is created a multi-level dynamic pages using child tables.",
                tooltipText:
                  "Create multi-level dynamic pages using child tables. Default value: false.",
              },
              {
                configProperty: "actionConfiguration.formData.foreignTableId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "foreignTableId",
                initialValue: "null",
                label: "Foreign table ID",
                placeholderText: "5378084",
                subtitle: "ID of another table. ",
                tooltipText:
                  "ID of another table to which the column refers/points to. ",
              },
              {
                configProperty: "actionConfiguration.formData.foreignColumnId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "foreignColumnId",
                initialValue: "null",
                label: "Foreign column ID",
                placeholderText: "5378084",
                subtitle: "ID of the column from another table.",
                tooltipText:
                  "ID of the column from another table to which the column refers/points to. ",
              },
              {
                configProperty: "actionConfiguration.formData.dynamicMetaTags",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "dynamicMetaTags",
                initialValue: "{}",
                label: "Dynamic meta tags",
                placeholderText: "{}",
                requiresEncoding: false,
                subtitle: "Key value pairs. ",
                tooltipText:
                  "The key value pairs of the metadata fields with the associated column ids. type: array",
              },
            ],
            name: "Update Existing table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_EXISTING_TABLE'}}",
            },
          },
          {
            identifier: "REMOVES_USER",
            controlType: "SECTION",
            children: [
              {
                identifier: "idProperty",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "ID property",
                configProperty: "actionConfiguration.formData.idProperty",
                tooltipText:
                  "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL. ",
                subtitle: "Name of a property with unique user values.",
              },
              {
                identifier: "userId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "User ID",
                configProperty: "actionConfiguration.formData.userId",
                isRequired: true,
                tooltipText: "Identifier of user to delete. ",
                subtitle: "Identifier of user to delete. ",
                placeholderText: "13358977",
              },
            ],
            name: "Removes User",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'REMOVES_USER'}}",
            },
          },
          {
            identifier: "SEARCH_OBJECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                configProperty: "actionConfiguration.formData.objectType",
                label: "Object type",
                placeholderText: "contacts",
                subtitle: "Valid object type for the CRM. ",
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.) ",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "value",
                isRequired: true,
                label: "Value",
                placeholderText: "Bryan",
                subtitle: "Filter the matching property values",
                tooltipText:
                  "Use filters in the request body to limit the results to only records with matching property values. ",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.propertyName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "propertyName",
                isRequired: true,
                label: "Property name",
                placeholderText: "firstname",
                requiresEncoding: false,
                subtitle: "Filter the matching property values",
                tooltipText:
                  "Use filters in the request body to limit the results to only records with matching property values. ",
              },
              {
                configProperty: "actionConfiguration.formData.operator",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "operator",
                isRequired: true,
                label: "Operator",
                placeholderText: "EQ",
                requiresEncoding: true,
                subtitle: "Logical operator.",
                tooltipText:
                  "Logical operator. EQ (Equal to), LT (Less than), GT (Greater than),BETWEEN (Within the specified range), IN (Included within the specified list), CONTAINS_TOKEN. ",
              },
              {
                configProperty: "actionConfiguration.formData.sorts",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sorts",
                isRequired: true,
                label: "Sorts",
                placeholderText:
                  ' [ {     "propertyName": "createdate",     "direction": "DESCENDING"   }]',
                requiresEncoding: false,
                subtitle: "Array with different sorting rules.",
                tooltipText:
                  "Use a sorting rule in the request body to list results in ascending or descending order. Only one sorting rule can be applied to any search.",
              },
              {
                configProperty: "actionConfiguration.formData.query",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "query",
                label: "Query",
                requiresEncoding: false,
                subtitle:
                  "Letter or word to find for all objects with a default text property that contain this value",
                tooltipText:
                  "Searches for all objects with a default text property value containing in the string. ",
              },
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "properties",
                isRequired: true,
                label: "Properties",
                placeholderText: "b",
                requiresEncoding: false,
                subtitle:
                  "Comma separated list of the properties to be returned.",
                tooltipText:
                  "A comma separated list of the properties to be returned in the  response. If any of the specified properties are not present on the requested object(s), they will be ignored. type: array",
              },
              {
                configProperty: "actionConfiguration.formData.limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "limit",
                initialValue: "10",
                isRequired: true,
                label: "Limit",
                placeholderText: "10",
                subtitle:
                  "Maximum number of results objects to display per page. ",
                tooltipText:
                  "The maximum number of results to display per page.",
              },
              {
                configProperty: "actionConfiguration.formData.after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "after",
                initialValue: "0",
                isRequired: true,
                label: "After",
                placeholderText: "1",
                requiresEncoding: false,
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
              },
            ],
            name: "Search object",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'SEARCH_OBJECT'}}",
            },
          },
          {
            identifier: "GET_FOLDER",
            controlType: "SECTION",
            children: [
              {
                identifier: "properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Properties to set on returned folder. type: array",
                subtitle:
                  "Comma separated list of the properties to be returned in the response.",
                label: "Properties",
                configProperty: "actionConfiguration.formData.properties",
              },
              {
                identifier: "folderId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                requiresEncoding: true,
                tooltipText: "Identifier of desired folder. ",
                subtitle: "Folder ID. ",
                label: "Folder ID",
                placeholderText: "74302751362",
                configProperty: "actionConfiguration.formData.folderId",
              },
            ],
            name: "Get folder",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_FOLDER'}}",
            },
          },
          {
            identifier: "CREATE_OBJECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                configProperty: "actionConfiguration.formData.objectType",
                label: "Object type",
                placeholderText: "contacts",
                subtitle: "Valid object type for the CRM.",
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "properties",
                isRequired: true,
                label: "Properties",
                placeholderText:
                  '{ "company": "Elv",    "email": "test@elv.net",    "firstname": "Test",         "lastname": "Cooper", "phone": "(877)112-05252", "website": "biglytics.net"}',
                requiresEncoding: false,
                subtitle: "Properties object for the specific objectType. ",
                tooltipText: "A properties object for the specific objecType.",
              },
            ],
            name: "Create object",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_OBJECT'}}",
            },
          },
          {
            identifier: "SEE_DETAILS_ACCOUNT'S_TEAMS",
            controlType: "SECTION",
            children: [],
            name: "See Details account's Teams",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'SEE_DETAILS_ACCOUNT'S_TEAMS'}}",
            },
          },
          {
            identifier: "READ_OBJECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Properties",
                configProperty: "actionConfiguration.formData.properties",
                requiresEncoding: true,
                tooltipText:
                  "A comma separated list of the properties to be returned in the  response. If any of the specified properties are not present on the  requested object(s), they will be ignored. type: String[]",
                subtitle:
                  "Comma separated list of the properties to be returned in the response.",
              },
              {
                configProperty:
                  "actionConfiguration.formData.propertiesWithHistory",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "propertiesWithHistory",
                label: "Properties with history",
                requiresEncoding: true,
                tooltipText:
                  "A comma separated list of the properties to be returned along with  their history of previous values. If any of the specified properties are  not present on the requested object(s), they will be ignored. Usage of  this parameter will reduce the maximum number of objects that can be  read by a single request. type: String[]",
                subtitle:
                  "Comma separated list of the properties to be returned along with  their history of previous values.",
              },
              {
                configProperty: "actionConfiguration.formData.associations",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "associations",
                label: "Associations",
                requiresEncoding: true,
                tooltipText:
                  "A comma separated list of object types to retrieve associated IDs  for. If any of the specified associations do not exist, they will be  ignored. type: String[]",
                subtitle:
                  "Comma separated list of object types to retrieve associated IDs for.",
              },
              {
                configProperty: "actionConfiguration.formData.archived",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "archived",
                label: "Archived",
                requiresEncoding: false,
                tooltipText: "Specifies whether to return archived objects. ",
                subtitle: "If true, return only archived results.",
                placeholderText: "false",
              },
              {
                configProperty: "actionConfiguration.formData.objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectType",
                isRequired: true,
                label: "Object type",
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                subtitle: "Valid object type for the CRM.",
                placeholderText: "contacts",
              },
              {
                configProperty: "actionConfiguration.formData.objectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectId",
                isRequired: true,
                label: "Object ID",
                tooltipText:
                  "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                subtitle: "ID of the object. ",
                placeholderText: "201",
              },
            ],
            name: "Read object",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'READ_OBJECT'}}",
            },
          },
          {
            identifier: "GET_TABLE_ROW",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableIdOrName",
                label: "Table ID or name",
                subtitle: "ID or name of the table. ",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                isRequired: true,
                requiresEncoding: true,
                placeholderText: "test_table",
              },
              {
                configProperty: "actionConfiguration.formData.rowId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "rowId",
                label: "Row ID",
                subtitle: "Row ID.",
                tooltipText: "The ID of the row.",
                isRequired: true,
                placeholderText: "5378084",
              },
            ],
            name: "Get table Row",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_TABLE_ROW'}}",
            },
          },
          {
            identifier: "ADD_USER",
            controlType: "SECTION",
            children: [
              {
                identifier: "email",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Email",
                configProperty: "actionConfiguration.formData.email",
                placeholderText: "newUser@email.com",
                isRequired: true,
                tooltipText: "The created user's email.",
                subtitle: "User email. ",
              },
              {
                identifier: "roleId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Role ID",
                configProperty: "actionConfiguration.formData.roleId",
                initialValue: "null",
                placeholderText: "310427",
                tooltipText: "The user's role.",
                subtitle: "User role ID.  ",
              },
              {
                configProperty: "actionConfiguration.formData.primaryTeamId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "primaryTeamId",
                initialValue: "null",
                label: "Primary team ID",
                placeholderText: "7824745",
                tooltipText: "The user's primary team.",
                subtitle: "User primary team ID. ",
              },
              {
                configProperty: "actionConfiguration.formData.secondaryTeamIds",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "secondaryTeamIds",
                initialValue: "[]",
                label: "Secondary team Ids",
                placeholderText: " [”7885423”,”78525623”]",
                tooltipText: "The user's additional teams.  type: array.",
                subtitle: "User additional teams IDs. ",
              },
              {
                configProperty: "actionConfiguration.formData.sendWelcomeEmail",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sendWelcomeEmail",
                initialValue: "false",
                label: "Send welcome email",
                placeholderText: "false",
                isRequired: true,
                tooltipText: "Whether to send a welcome email  ",
                subtitle: "If true, send a welcome email.",
              },
            ],
            name: "Add User",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'ADD_USER'}}",
            },
          },
          {
            identifier: "IMPORT_FILE",
            controlType: "SECTION",
            children: [
              {
                identifier: "access",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                requiresEncoding: true,
                tooltipText:
                  "PUBLIC_INDEXABLE:  File is publicly accessible by anyone who has the URL. Search engines  can index the file. PUBLIC_NOT_INDEXABLE: File is publicly accessible by anyone who has the URL. Search engines can't index the file. PRIVATE: File is NOT publicly accessible. Requires a signed URL to see content. Search engines can't  index the file. ",
                subtitle: "Type of access to the file. ",
                label: "Access",
                placeholderText: "PUBLIC_INDEXABLE",
                configProperty: "actionConfiguration.formData.access",
              },
              {
                identifier: "ttl",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Time to live. If specified the file will be deleted after the given time frame. ",
                subtitle:
                  "The file will be deleted after the given time frame.",
                placeholderText: "5",
                label: "TTL",
                configProperty: "actionConfiguration.formData.ttl",
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                label: "Name",
                placeholderText: "test-file",
                requiresEncoding: true,
                subtitle: "Name of the resulting file in the file manager. ",
                tooltipText:
                  "Name to give the resulting file in the file manager. ",
              },
              {
                identifier: "url",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                requiresEncoding: false,
                tooltipText: "URL to download the new file from. ",
                subtitle: "URL to download the new file from.",
                label: "URL",
                configProperty: "actionConfiguration.formData.url",
              },
              {
                configProperty: "actionConfiguration.formData.folderPath",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "folderPath",
                isRequired: true,
                label: "Folder path",
                placeholderText: "/myNewFolder",
                requiresEncoding: true,
                subtitle: "Destination folder path for the uploaded file. ",
                tooltipText:
                  "One of folderPath or folderId is required. Destination folder path for the uploaded file. If the folder path does not exist, there will be an attempt to create the folder path. ",
              },
              {
                configProperty:
                  "actionConfiguration.formData.duplicateValidationStrategy",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "duplicateValidationStrategy",
                isRequired: true,
                label: "Duplicate validation strategy",
                placeholderText: "NONE",
                requiresEncoding: true,
                subtitle: "Type of strategy for duplicate validation.",
                tooltipText:
                  "NONE: Do not run any duplicate validation. REJECT: Reject the upload if a duplicate is found. RETURN_EXISTING: If a duplicate file is found, do not upload a new file and return the found duplicate instead. ",
              },
              {
                configProperty:
                  "actionConfiguration.formData.duplicateValidationScope",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "duplicateValidationScope",
                isRequired: true,
                label: "Duplicate validation scope",
                placeholderText: "EXACT_FOLDER",
                requiresEncoding: true,
                subtitle:
                  "Look for a duplicate file in the entire account or a duplicate file in the provided folder. ",
                tooltipText:
                  "ENTIRE_PORTAL: Look for a duplicate file in the entire account. EXACT_FOLDER: Look for a duplicate file in the provided folder. ",
              },
              {
                configProperty: "actionConfiguration.formData.overwrite",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "overwrite",
                initialValue: "false",
                isRequired: true,
                label: "Overwrite",
                placeholderText: "false",
                subtitle:
                  "If true, overwrites existing files if a file with the same name exists in the given folder. ",
                tooltipText:
                  "If true, it will overwrite existing files if a file with the same name exists in the given folder.",
              },
            ],
            name: "Import File",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'IMPORT_FILE'}}",
            },
          },
          {
            identifier: "RETRIEVES_ROLES_ACCOUNT",
            controlType: "SECTION",
            children: [],
            name: "Retrieves Roles account",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'RETRIEVES_ROLES_ACCOUNT'}}",
            },
          },
          {
            identifier: "GET_CURRENT_REDIRECTS",
            controlType: "SECTION",
            children: [
              {
                identifier: "createdAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Created at",
                configProperty: "actionConfiguration.formData.createdAt",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText:
                  "Only return redirects created on exactly this date. ",
                subtitle:
                  "Return redirects created on exactly this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
              },
              {
                identifier: "createdAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Created after",
                configProperty: "actionConfiguration.formData.createdAfter",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText: "Only return redirects created after this date.  ",
                subtitle:
                  "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
              },
              {
                configProperty: "actionConfiguration.formData.createdBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdBefore",
                label: "Created before",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText:
                  "Only return redirects created before this date.  ",
                subtitle:
                  "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAt",
                label: "Updated at",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText:
                  "Only return redirects last updated on exactly this date.  ",
                subtitle:
                  "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAfter",
                label: "Updated after",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText:
                  "Only return redirects last updated after this date.  ",
                subtitle:
                  "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
              },
              {
                configProperty: "actionConfiguration.formData.updatedBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedBefore",
                label: "Updated before",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                tooltipText:
                  "Only return redirects last updated before this date. ",
                subtitle:
                  "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
              },
              {
                configProperty: "actionConfiguration.formData.sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sort",
                label: "Sort",
                requiresEncoding: true,
                tooltipText:
                  "Column names to sort the results by. type: array.",
                subtitle: "Column names to sort the results by.",
              },
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "properties",
                label: "Properties",
                requiresEncoding: true,
                tooltipText:
                  "A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignored. type: array.",
                subtitle:
                  "Comma separated list of the properties to be returned in the response.",
              },
              {
                configProperty: "actionConfiguration.formData.after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "after",
                label: "Next page token",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                placeholderText: "MQ%3D%3D",
              },
              {
                configProperty: "actionConfiguration.formData.before",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "before",
                label: "Before page token",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or  before field, in the response.",
                placeholderText: "MQ%3D%3D",
              },
              {
                configProperty: "actionConfiguration.formData.limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "limit",
                initialValue: "1000",
                label: "Limit",
                placeholderText: "1000",
                tooltipText:
                  "Maximum number of results to return. Default is 1000.",
                subtitle: "The maximum number of published tables to return. ",
              },
              {
                configProperty: "actionConfiguration.formData.archived",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "archived",
                initialValue: "false",
                label: "Archived",
                placeholderText: "false",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
                subtitle: "Whether to return only archived results.",
              },
            ],
            name: "Get current redirects",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_CURRENT_REDIRECTS'}}",
            },
          },
          {
            identifier: "GET_DETAILS_FOR_A_REDIRECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "urlRedirectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "URL redirect ID",
                configProperty: "actionConfiguration.formData.urlRedirectId",
                isRequired: true,
                requiresEncoding: true,
                tooltipText:
                  "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                subtitle: "Write the ID of the target redirect. ",
                placeholderText: "71783843089",
              },
            ],
            name: "Get Details for a redirect",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_DETAILS_FOR_A_REDIRECT'}}",
            },
          },
          {
            identifier: "CREATE_FOLDER",
            controlType: "SECTION",
            children: [
              {
                identifier: "name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Name",
                configProperty: "actionConfiguration.formData.name",
                tooltipText: "Desired name for the folder.",
                subtitle: "Folder name.  ",
                requiresEncoding: true,
                isRequired: true,
                placeholderText: "myNewFolder",
              },
              {
                configProperty: "actionConfiguration.formData.parentPath",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "parentPath",
                label: "Parent path",
                subtitle:
                  "Path of the parent of the created folder. If not specified the folder will be created at the root level. ",
                tooltipText:
                  "Path of the parent of the created folder. If not specified the folder will be created at the root level. parentFolderPath and parentFolderId cannot be set at the same time. ",
                requiresEncoding: true,
                placeholderText: "/myNewFolder1",
              },
            ],
            name: "Create folder",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_FOLDER'}}",
            },
          },
          {
            identifier: "UPDATE_A_REDIRECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "urlRedirectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "The ID of the target redirect. ",
                subtitle: "The ID of the target redirect.",
                placeholderText: "71783843089",
                label: "URL redirect ID",
                configProperty: "actionConfiguration.formData.urlRedirectId",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                identifier: "id",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                subtitle: "Unique ID of this URL redirect.",
                placeholderText: "71783843089",
                label: "ID",
                configProperty: "actionConfiguration.formData.id",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                identifier: "routePrefix",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The target incoming URL, path, or pattern to match for redirection. ",
                subtitle: "Target incoming URL",
                label: "Route prefix",
                configProperty: "actionConfiguration.formData.routePrefix",
                placeholderText: "/the-original-source",
              },
              {
                configProperty: "actionConfiguration.formData.destination",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "destination",
                isRequired: true,
                label: "Destination",
                placeholderText:
                  "http://6255.sites.hubspot.com/destination-url",
                requiresEncoding: true,
                subtitle: "Destination URL",
                tooltipText:
                  "The destination URL, where the target URL should be redirected if it matches the routePrefix.",
              },
              {
                configProperty: "actionConfiguration.formData.redirectStyle",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "redirectStyle",
                isRequired: true,
                label: "Redirect style",
                placeholderText: "302",
                subtitle: "Type of redirect to create. ",
                tooltipText:
                  "The type of redirect to create. Options include: 301 (permanent), 302 (temporary), or 305 (proxy). ",
              },
              {
                configProperty:
                  "actionConfiguration.formData.isOnlyAfterNotFound",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isOnlyAfterNotFound",
                initialValue: "false",
                label: " Is only after not found",
                placeholderText: "false",
                subtitle: "If true the URL redirect mapping should apply. ",
                tooltipText:
                  "Whether the URL redirect mapping should apply only if a live page on the URL isn't found. If False, the URL redirect mapping will take precedence over any existing page. ",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.isMatchFullUrl",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isMatchFullUrl",
                isRequired: true,
                label: "Is match full URL",
                subtitle:
                  "If  true the routePrefix  should match on the entire URL. ",
                tooltipText:
                  "Whether the routePrefix  should match on the entire URL, including the domain. ",
                initialValue: "false",
                placeholderText: "false",
              },
              {
                configProperty:
                  "actionConfiguration.formData.isMatchQueryString",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isMatchQueryString",
                initialValue: "false",
                label: "Is match query string",
                placeholderText: "false",
                subtitle:
                  "If true the routePrefix should match the entire URL route.",
                tooltipText:
                  "Whether the routePrefix  should match on the entire URL path, including the query string. ",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.isPattern",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isPattern",
                initialValue: "false",
                label: "Is pattern",
                placeholderText: "false",
                subtitle:
                  "If true the routePrefix  should match based on pattern. ",
                tooltipText:
                  "Whether the routePrefix  should match based on pattern. ",
                isRequired: true,
              },
              {
                configProperty:
                  "actionConfiguration.formData.isTrailingSlashOptional",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isTrailingSlashOptional",
                initialValue: "false",
                label: "Is trailing slash optional",
                placeholderText: "false",
                subtitle: "If true a trailing slash will be ignored. ",
                tooltipText: "Whether a trailing slash will be ignored. ",
                isRequired: true,
              },
              {
                configProperty:
                  "actionConfiguration.formData.isProtocolAgnostic",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isProtocolAgnostic",
                initialValue: "false",
                label: "Is protocol agnostic",
                placeholderText: "false",
                subtitle:
                  "if true, the routePrefix  should match both HTTP and HTTPS protocols",
                tooltipText:
                  "Whether the routePrefix  should match both HTTP and HTTPS protocols. ",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.precedence",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "precedence",
                label: "Precedence",
                placeholderText: "1000000001",
                subtitle: "Prioritize URL redirection.",
                tooltipText:
                  "Used to prioritize URL redirection. If a given URL matches more than one redirect, the one with the lower precedence will be used.",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.createdAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAt",
                label: "Created at",
                placeholderText: "2022-08-25T23:23:49.566Z",
                subtitle: "URL redirect was first created.",
                tooltipText:
                  "When the url redirect was first created, in milliseconds since the epoch. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAt",
                label: "Updated at",
                placeholderText: "2022-08-26T03:20:04.675Z",
                subtitle: "URL redirect was last updated.",
                tooltipText:
                  "When the url redirect was last updated, in milliseconds since the epoch. ",
              },
            ],
            name: "Update a redirect",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_A_REDIRECT'}}",
            },
          },
          {
            identifier: "GET_FILE",
            controlType: "SECTION",
            children: [
              {
                identifier: "fileId",
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the file was created. ",
                subtitle: "ID of the desired file. ",
                label: "File ID",
                configProperty: "actionConfiguration.formData.fileId",
                isRequired: true,
                placeholderText: "76030562986",
              },
            ],
            name: "Get File",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_FILE'}}",
            },
          },
          {
            identifier: "ADD_NEW_ROW_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name. ",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "path",
                label: "Path",
                placeholderText: "test_path",
                subtitle: "The value for hs_path column.",
                tooltipText:
                  "Value for hs_path  column, which will be used as slug in the dynamic pages.",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                label: "Name",
                placeholderText: "text_title",
                subtitle: "Value for hs_name column.",
                tooltipText:
                  "Value for hs_name  column, which will be used as title in the dynamic pages. ",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.childTableId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "childTableId",
                label: "Child table ID",
                subtitle: "Value for the column child table id.",
                tooltipText: "Value for the column child table id.",
                placeholderText: "5378084",
                initialValue: "null",
              },
              {
                configProperty: "actionConfiguration.formData.values",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "values",
                isRequired: true,
                label: "Values",
                placeholderText:
                  '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                requiresEncoding: false,
                subtitle: "Key value pairs. ",
                tooltipText:
                  "List of key value pairs with the column name and column value. type: array.",
              },
            ],
            name: "Add New Row table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'ADD_NEW_ROW_TABLE'}}",
            },
          },
          {
            identifier: "GET_ROWS_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Column names to sort the results by. type: array.",
                subtitle:
                  "Fields to use for sorting results. array with fields to use for sorting results.",
                label: "Sort",
                configProperty: "actionConfiguration.formData.sort",
              },
              {
                identifier: "after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                label: "Next page token",
                placeholderText: "MTA%3D",
                configProperty: "actionConfiguration.formData.after",
              },
              {
                identifier: "limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                initialValue: "1000",
                tooltipText:
                  "Maximum number of results to return. Default is 1000.",
                subtitle: "The maximum number of published tables to return. ",
                label: "Limit",
                placeholderText: "1000",
                configProperty: "actionConfiguration.formData.limit",
              },
              {
                identifier: "properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Specify the column names to get results containing only the required columns instead of all column details. type: array.",
                subtitle: "Array with the column names.",
                label: "Properties",
                configProperty: "actionConfiguration.formData.properties",
              },
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name.",
                label: "Table ID or name",
                placeholderText: "test_table",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
              },
            ],
            name: "Get rows table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_ROWS_TABLE'}}",
            },
          },
          {
            identifier: "GDPR_DELETE",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectType",
                isRequired: true,
                label: "Object type",
                subtitle: "Valid object type for the CRM.  ",
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.).",
                placeholderText: "contacts",
              },
              {
                configProperty: "actionConfiguration.formData.objectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectId",
                isRequired: true,
                label: "Object ID",
                placeholderText: "201",
                subtitle: "Identifier of the object. ",
                tooltipText:
                  "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
              },
            ],
            name: "GDPR Delete",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GDPR_DELETE'}}",
            },
          },
          {
            identifier: "CLONE_ROW",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name.",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                placeholderText: "test_table",
              },
              {
                identifier: "rowId",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "The ID of the row.",
                subtitle: "Row ID.",
                label: "Row ID",
                configProperty: "actionConfiguration.formData.rowId",
                placeholderText: "5378084",
              },
            ],
            name: "Clone Row",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CLONE_ROW'}}",
            },
          },
          {
            identifier: "CHECK_FOLDER_UPDATE_STATUS",
            controlType: "SECTION",
            children: [
              {
                identifier: "taskId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                requiresEncoding: true,
                tooltipText: "Task ID of folder update. ",
                subtitle: "ID given by the response when updating a folder. ",
                label: "Task ID",
                placeholderText: "AUhEIQ.AAAAEUzKAoI.V3DwstkzRO-PxOjIVjrW5Q",
                configProperty: "actionConfiguration.formData.taskId",
              },
            ],
            name: "Check folder Update Status",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CHECK_FOLDER_UPDATE_STATUS'}}",
            },
          },
          {
            identifier: "UNPUBLISH_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "includeForeignIds",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Set this to true  to populate foreign ID values in the response.",
                subtitle:
                  "If true, populate foreign ID values in the response.",
                label: "Include foreign IDs",
                placeholderText: "false",
                configProperty:
                  "actionConfiguration.formData.includeForeignIds",
              },
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name to unpublish.",
                label: "Table ID or name",
                placeholderText: "test_table.",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
              },
            ],
            name: "Unpublish table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UNPUBLISH_TABLE'}}",
            },
          },
          {
            identifier: "GET_CURRENT_DOMAINS",
            controlType: "SECTION",
            children: [
              {
                identifier: "createdAt",
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Only return domains created at this date. ",
                subtitle:
                  "Return domains created at this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                label: "Created at",
                configProperty: "actionConfiguration.formData.createdAt",
                placeholderText: "2022-02-24T23:18:38.806Z",
              },
              {
                identifier: "createdAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Only return domains created after this date. ",
                subtitle:
                  "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ. ",
                label: "Created after",
                configProperty: "actionConfiguration.formData.createdAfter",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.createdBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdBefore",
                label: "Created before",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText: "Only return domains created before this date. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAt",
                label: "Updated at",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText: "Only return domains updated at this date. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAfter",
                label: "Updated after",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText: "Only return domains updated after this date. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedBefore",
                label: "Updated before",
                placeholderText: "2022-02-24T23:18:38.806Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText: "Only return domains updated before this date. ",
              },
              {
                configProperty: "actionConfiguration.formData.sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sort",
                label: "Sort",
                requiresEncoding: true,
                subtitle: "Column names to sort the results by.",
                tooltipText:
                  "Specifies the column names to sort the results by. type: array.",
              },
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "properties",
                label: "Properties",
                requiresEncoding: true,
                subtitle:
                  "Comma separated list of the properties to be returned in the response.",
                tooltipText:
                  "A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignore. type: array.",
              },
              {
                configProperty: "actionConfiguration.formData.after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "after",
                label: "Next page token",
                placeholderText: "MQ%3D%3D",
                requiresEncoding: true,
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
              },
              {
                configProperty: "actionConfiguration.formData.before",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "before",
                label: "Before page token",
                placeholderText: "MQ%3D%3D.",
                requiresEncoding: true,
                subtitle:
                  "To obtain the token look for the next page token or before field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
              },
              {
                configProperty: "actionConfiguration.formData.limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "limit",
                initialValue: "1000",
                isRequired: false,
                label: "Limit",
                placeholderText: "1000",
                requiresEncoding: false,
                subtitle: "The maximum number of published tables to return. ",
                tooltipText:
                  "Maximum number of results to return. Default is 1000.",
              },
              {
                configProperty: "actionConfiguration.formData.archived",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "archived",
                initialValue: "false",
                label: "Archived",
                placeholderText: "false",
                subtitle: "Whether to return only archived results.",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
              },
            ],
            name: "Get current Domains",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_CURRENT_DOMAINS'}}",
            },
          },
          {
            identifier: "CREATE_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "name",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Name that will be used to identify the table when it is created.",
                subtitle: "Name of the table.",
                placeholderText: "test_table",
                label: "Name",
                configProperty: "actionConfiguration.formData.name",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.label",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "label",
                isRequired: true,
                label: "Label",
                placeholderText: "Test table",
                requiresEncoding: false,
                subtitle: "Label of the resulting table.",
                tooltipText:
                  "Label to represent the table name when it is created.",
              },
              {
                configProperty: "actionConfiguration.formData.useForPages",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "useForPages",
                initialValue: "false",
                label: "Use for pages",
                placeholderText: "false",
                subtitle:
                  "If true, the table can be used to create dynamic pages.",
                tooltipText:
                  "Whether the table can be used for creation of dynamic pages. ",
              },
              {
                configProperty: "actionConfiguration.formData.columns",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "columns",
                isRequired: true,
                label: "Columns",
                requiresEncoding: false,
                subtitle: "List of columns in the table.",
                tooltipText:
                  "List of columns in the table. Refer Hubspot documentation to create the columns, all column fields are required (id, name, label, type, options). in options you can add multi-columns. type: array",
              },
              {
                configProperty:
                  "actionConfiguration.formData.allowPublicApiAccess",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "allowPublicApiAccess",
                initialValue: "false",
                label: "Allow public API access",
                placeholderText: "false",
                requiresEncoding: false,
                subtitle:
                  "If true, the table can be read by public without authorization.",
                tooltipText:
                  "Whether the table can be read by public without authorization. ",
              },
              {
                configProperty: "actionConfiguration.formData.allowChildTables",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "allowChildTables",
                initialValue: "false",
                label: "Allow child tables",
                placeholderText: "false",
                subtitle: "If true, child tables can be created.",
                tooltipText: "Whether child tables can be created.",
              },
              {
                configProperty:
                  "actionConfiguration.formData.enableChildTablePages",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "enableChildTablePages",
                initialValue: "false",
                label: "Enable child table pages",
                placeholderText: "false",
                subtitle:
                  "If true, create multi-level dynamic pages using child tables. ",
                tooltipText:
                  "Create multi-level dynamic pages using child tables. ",
              },
              {
                configProperty: "actionConfiguration.formData.foreignTableId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "foreignTableId",
                initialValue: "null",
                label: "Foreign table ID",
                placeholderText: "5378084",
                subtitle:
                  "ID of another table to which the column refers/points to.",
                tooltipText:
                  "ID of another table to which the column refers/points to. ",
              },
              {
                configProperty: "actionConfiguration.formData.foreignColumnId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "foreignColumnId",
                initialValue: "null",
                label: "Foreign column ID",
                placeholderText: "5378084",
                subtitle: "Column ID from another table. ",
                tooltipText:
                  "ID of a column from another table to which the column refers/points to. ",
              },
              {
                configProperty: "actionConfiguration.formData.dynamicMetaTags",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "dynamicMetaTags",
                initialValue: "{}",
                label: "Dynamic meta tags",
                placeholderText: "{}",
                requiresEncoding: false,
                subtitle: "Key value pairs. ",
                tooltipText:
                  "The key value pairs of the metadata fields with the associated column ids. type: array.",
              },
            ],
            name: "Create table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_TABLE'}}",
            },
          },
          {
            identifier: "GET_DETAILS_PUBLISHED_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "archived",
                requiresEncoding: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
                subtitle: "If true, return archived results.",
                placeholderText: "false",
                label: "Archived",
                initialValue: "false",
                configProperty: "actionConfiguration.formData.archived",
              },
              {
                identifier: "includeForeignIds",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Set this to true to populate foreign ID values in the result. ",
                subtitle: "If true, populate foreign ID values in the result. ",
                placeholderText: "false",
                label: "Include foreign IDs",
                initialValue: "false",
                configProperty:
                  "actionConfiguration.formData.includeForeignIds",
              },
              {
                identifier: "tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table name or ID to return  details.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
              },
            ],
            name: "Get Details published table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_DETAILS_PUBLISHED_TABLE'}}",
            },
          },
          {
            identifier: "SEARCH_FILE",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "properties",
                label: "Properties",
                subtitle: "Desired file properties in the return object.",
                tooltipText:
                  "Desired file properties in the return object. type: array",
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "after",
                label: "Next page token",
                placeholderText: " AAAAAQ",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.before",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "before",
                label: "Before page token",
                placeholderText: " AAAAAQ",
                requiresEncoding: true,
                subtitle:
                  "To obtain the token look for the next page token or before field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
              },
              {
                configProperty: "actionConfiguration.formData.limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "limit",
                label: "Limit",
                subtitle: "The maximum number of result per page. ",
                tooltipText:
                  "Maximum number of results to return. Default is 100.",
                initialValue: "100",
                placeholderText: "10",
              },
              {
                configProperty: "actionConfiguration.formData.sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sort",
                label: "Sort",
                requiresEncoding: true,
                subtitle: "Columns names to sort the result by.",
                tooltipText: "Sort files by a given field. type: array",
              },
              {
                configProperty: "actionConfiguration.formData.id",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "id",
                label: "ID",
                subtitle: "Search files by given ID. ",
                tooltipText: "Identifier of the file",
                placeholderText: "74498869791",
              },
              {
                configProperty: "actionConfiguration.formData.createdAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAt",
                label: "Created at",
                placeholderText: "2022-04-29T00:00:00.000Z",
                requiresEncoding: true,
                subtitle:
                  "Return files created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of creation.",
              },
              {
                configProperty: "actionConfiguration.formData.createdAtLte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAtLte",
                label: "Created at Lte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                subtitle:
                  "Return files created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of creation in Lte format.",
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.createdAtGte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAtGte",
                label: "Created at Gte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                requiresEncoding: true,
                subtitle:
                  "Return files created before this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of creation in Gte format. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAt",
                label: "Updated at",
                placeholderText: "2022-04-29T00:00:00.000Z",
                requiresEncoding: true,
                subtitle:
                  "Return files updated at this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of latest updated. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAtLte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAtLte",
                label: "Updated at Lte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                requiresEncoding: true,
                subtitle:
                  "Return files created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of latest updated in Lte.",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAtGte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAtGte",
                label: "Updated at Gte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                requiresEncoding: true,
                subtitle:
                  "Return files updated at this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                tooltipText: "Search files by time of latest updated in Gte. ",
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                label: "Name",
                placeholderText: "test-file",
                requiresEncoding: true,
                subtitle: "Search for files containing the given name.",
                tooltipText: "Search for files containing the given name. ",
              },
              {
                configProperty: "actionConfiguration.formData.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "path",
                label: "Path",
                placeholderText: "/myNewFolder",
                subtitle: "Search files by path of the file",
                tooltipText: "Search files by path. ",
              },
              {
                configProperty: "actionConfiguration.formData.parentFolderId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "parentFolderId",
                label: "Parent folder ID",
                placeholderText: "68720958502",
                subtitle: "Search files within given folder ID.",
                tooltipText: "Search files within given folder ID. ",
              },
              {
                configProperty: "actionConfiguration.formData.size",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "size",
                label: "Size",
                placeholderText: "187158",
                subtitle: "Query by file size. ",
                tooltipText: "Query by file size.",
              },
              {
                configProperty: "actionConfiguration.formData.height",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "height",
                label: "Height",
                placeholderText: "633",
                subtitle: "Search files by height of image or video. ",
                tooltipText: "Search files by height of image or video. ",
              },
              {
                configProperty: "actionConfiguration.formData.width",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "width",
                label: "Width",
                placeholderText: "1206",
                subtitle: "Search files by width of image or video. ",
                tooltipText: "Search files by width of image or video. ",
              },
              {
                configProperty: "actionConfiguration.formData.enconding",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "enconding",
                label: "Enconding",
                placeholderText: "png",
                requiresEncoding: true,
                subtitle: "Search files with specified encoding.",
                tooltipText: "Search files with specified encoding. ",
              },
              {
                configProperty: "actionConfiguration.formData.type",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "type",
                label: "Type",
                placeholderText: "IMG",
                requiresEncoding: true,
                subtitle: "Filter by provided file type. ",
                tooltipText: "Filter by provided file type. ",
              },
              {
                configProperty: "actionConfiguration.formData.extension",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "extension",
                label: "Extension",
                placeholderText: "png",
                requiresEncoding: true,
                subtitle: "Search files by given extension.",
                tooltipText: "Search files by given extension. ",
              },
              {
                configProperty: "actionConfiguration.formData.url",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "url",
                label: "URL",
                placeholderText:
                  "https://21513.fs1.hubspotusercontent-na1.net/hubfs/215149/myNewFolder/test-file.png",
                subtitle: "Search for given URL.",
                tooltipText: "Search for given URL. ",
              },
              {
                configProperty:
                  "actionConfiguration.formData.isUsableInContent",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "isUsableInContent",
                initialValue: "false",
                label: "Is usable in content",
                placeholderText: "false",
                subtitle:
                  "If true, shows files that have been marked to be used in new content. ",
                tooltipText:
                  "If true shows files that have been marked to be used in new content. It false shows files that should not be used in new content. ",
              },
              {
                configProperty:
                  "actionConfiguration.formData.allowsAnonymousAccess",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "allowsAnonymousAccess",
                initialValue: "false",
                label: "Allows anonymous access",
                placeholderText: "false",
                subtitle:
                  "If 'true' will show private files; if 'false' will show public files. ",
                tooltipText:
                  "If 'true' will show private files; if 'false' will show public files.",
              },
            ],
            name: "Search File",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'SEARCH_FILE'}}",
            },
          },
          {
            identifier: "SEARCH_FOLDERS",
            controlType: "SECTION",
            children: [
              {
                identifier: "properties",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Properties that should be included in the returned folders.",
                subtitle: "Desired folder properties in the return object.",
                label: "Properties",
                configProperty: "actionConfiguration.formData.properties",
              },
              {
                identifier: "after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                label: "Next page token",
                placeholderText: " AAAAAQ",
                configProperty: "actionConfiguration.formData.after",
              },
              {
                identifier: "before",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or before field, in the response.",
                label: "Before page token",
                placeholderText: "AAAAAQ",
                configProperty: "actionConfiguration.formData.before",
              },
              {
                identifier: "limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                initialValue: "10",
                tooltipText:
                  "Maximum number of results to return. Default is 100.",
                subtitle: "The maximum number of result per page. ",
                label: "Limit",
                placeholderText: "10",
                configProperty: "actionConfiguration.formData.limit",
              },
              {
                identifier: "sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Sort results by given property. For example -name sorts by name field descending, name sorts by name field ascending. type: array",
                subtitle: "Columns names to sort the result by.",
                label: "Sort",
                configProperty: "actionConfiguration.formData.sort",
              },
              {
                identifier: "id",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Identifier of the folder",
                subtitle: "Search folder by given ID. ",
                label: "ID",
                placeholderText: "74498869791",
                configProperty: "actionConfiguration.formData.id",
              },
              {
                identifier: "createdAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search for folders with the given creation timestamp. ",
                subtitle:
                  "Return folders created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "CreatedAt",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.createdAt",
              },
              {
                identifier: "createdAtLte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search folders by time of creation in Lte format.",
                subtitle:
                  "Return folders created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "Created at Lte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.createdAtLte",
              },
              {
                identifier: "createdAtGte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search folders by time of creation in Gte format. ",
                subtitle:
                  "Return folders created before this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "Created at Gte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.createdAtGte",
              },
              {
                identifier: "updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText: "Search for folder at given update timestamp. ",
                subtitle:
                  "Return folders updated at this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "Updated at",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.updatedAt",
              },
              {
                identifier: "updatedAtLte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search folders by time of latest updated in Lte. ",
                subtitle:
                  "Return folders updated at this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "Updated at Lte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.updatedAtLte",
              },
              {
                identifier: "updatedAtGte",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search folders by time of latest updated in Gte. ",
                subtitle:
                  "Return folders updated at this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                label: "Updated at Gte",
                placeholderText: "2022-04-29T00:00:00.000Z",
                configProperty: "actionConfiguration.formData.updatedAtGte",
              },
              {
                identifier: "name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "Search for folders containing the specified name. ",
                subtitle: "Search for folders containing the given name.",
                label: "Name",
                placeholderText: "test-file",
                configProperty: "actionConfiguration.formData.name",
              },
              {
                identifier: "path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Search folders by path. ",
                subtitle: "Search folders by path. ",
                label: "Path",
                placeholderText: "/myNewFolder",
                configProperty: "actionConfiguration.formData.path",
              },
              {
                identifier: "parentFolderId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Search for folders with the given parent folder ID. ",
                subtitle: "Search folders given parent folder ID.",
                label: "Parent folder ID",
                placeholderText: "68720958502",
                configProperty: "actionConfiguration.formData.parentFolderId",
              },
            ],
            name: "Search folders",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'SEARCH_FOLDERS'}}",
            },
          },
          {
            identifier: "EXPORT_PUBLISHED_VERSION_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "format",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "The file format to export. Possible values include CSV, XLSX, and XLS. ",
                subtitle: "Format file to export.",
                label: "Format",
                placeholderText: "CSV",
                configProperty: "actionConfiguration.formData.format",
              },
              {
                identifier: "tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name. ",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
              },
            ],
            name: "Export published Version table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'EXPORT_PUBLISHED_VERSION_TABLE'}}",
            },
          },
          {
            identifier: "DELETE_FILE",
            controlType: "SECTION",
            children: [
              {
                identifier: "fileId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "File ID",
                configProperty: "actionConfiguration.formData.fileId",
                isRequired: true,
                tooltipText:
                  "Identifier that was used when the file was created. ",
                subtitle: "File ID to delete. ",
                requiresEncoding: true,
                placeholderText: "76030562986",
              },
            ],
            name: "Delete File",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'DELETE_FILE'}}",
            },
          },
          {
            identifier: "PERMANENTLY_DELETE_ROWS",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                isRequired: true,
                requiresEncoding: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
              },
              {
                identifier: "inputs",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "ID rows that want to get. type: array.",
                subtitle: "Row ID. ",
                placeholderText: "[”5378084”,”71003521”]",
                label: "Inputs",
                configProperty: "actionConfiguration.formData.inputs",
                requiresEncoding: false,
              },
            ],
            name: "Permanently Delete rows",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'PERMANENTLY_DELETE_ROWS'}}",
            },
          },
          {
            identifier: "CLONE_TABLE",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Name or ID of the table to be cloned.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.newName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "newName",
                label: "New name",
                placeholderText: "test_new_table",
                subtitle: "Name for the cloned table. ",
                tooltipText: "New name for the cloned table. ",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.newLabel",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "newLabel",
                label: "New label",
                placeholderText: "Test New table",
                subtitle: "Name for the new label. ",
                tooltipText: "New label for the cloned table.",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.copyRows",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "copyRows",
                isRequired: true,
                label: "Copy rows",
                subtitle: "If true, rows should be copied during cloning. ",
                tooltipText:
                  "Specifies whether to copy the rows during clone. Default Value: false",
                placeholderText: "false",
                initialValue: "false",
              },
            ],
            name: "Clone table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CLONE_TABLE'}}",
            },
          },
          {
            identifier: "UPDATE_OBJECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                configProperty: "actionConfiguration.formData.objectType",
                label: "Object type",
                placeholderText: "contacts ",
                subtitle: "Valid object type for the CRM.",
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.objectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "objectId",
                isRequired: true,
                label: "Object ID",
                placeholderText: "201",
                subtitle: "Identifier of the object.",
                tooltipText:
                  "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
              },
              {
                configProperty: "actionConfiguration.formData.properties",
                controlType: "QUERY_DYNAMIC_TEXT",
                identifier: "properties",
                isRequired: true,
                label: "Properties",
                placeholderText:
                  '{ "company": "Elv",    "email": "test@elv.net",    "firstname": "Test",         "lastname": "Cooper", "phone": "(877)112-05252", "website": "biglytics.net"}',
                requiresEncoding: false,
                subtitle: "Json format the properties.",
                tooltipText: "A properties object for the specific objecType.",
              },
            ],
            name: "Update object",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_OBJECT'}}",
            },
          },
          {
            identifier: "DELETE_FOLDER",
            controlType: "SECTION",
            children: [
              {
                identifier: "folderId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                requiresEncoding: true,
                tooltipText: "Identifier of folder to delete. ",
                subtitle: "Folder ID to delete.",
                label: "Folder ID",
                placeholderText: "74302751362",
                configProperty: "actionConfiguration.formData.folderId",
              },
            ],
            name: "Delete folder",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'DELETE_FOLDER'}}",
            },
          },
          {
            identifier: "DELETE_A_REDIRECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "urlRedirectId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "URL redirect ID",
                configProperty: "actionConfiguration.formData.urlRedirectId",
                isRequired: true,
                requiresEncoding: true,
                tooltipText:
                  "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                subtitle: "Write the ID of the target redirect.",
                placeholderText: "71783843089",
              },
            ],
            name: "Delete a redirect",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'DELETE_A_REDIRECT'}}",
            },
          },
          {
            identifier: "REPLACE_EXISTING_ROW",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.rowId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "rowId",
                label: "Row ID",
                placeholderText: "5378084",
                subtitle: "Row ID. ",
                tooltipText: "The ID of the row.",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "path",
                label: "Path",
                placeholderText: "test_path",
                subtitle: "The value for hs_path column. ",
                tooltipText:
                  "Value for hs_path  column, which will be used as slug in the dynamic pages. ",
                requiresEncoding: false,
                initialValue: "null",
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                label: "Name",
                subtitle: "Write the value for hs_name column.",
                tooltipText:
                  "Specifies the value for hs_name  column, which will be used as title in the dynamic pages. (String)",
                placeholderText: "text_title",
                initialValue: "null",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.childTableId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "childTableId",
                label: "Child table ID",
                placeholderText: "5378084",
                subtitle: "Value for the column child table id. ",
                tooltipText: "Value for the column child table id. ",
                initialValue: "null",
              },
              {
                configProperty: "actionConfiguration.formData.values",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "values",
                isRequired: true,
                label: "Values",
                placeholderText:
                  '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                requiresEncoding: false,
                subtitle: "Key value pairs. ",
                tooltipText:
                  "List of key value pairs with the column name and column value. type: array.",
              },
            ],
            name: "Replace Existing Row",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'REPLACE_EXISTING_ROW'}}",
            },
          },
          {
            identifier: "RETRIEVE_LIST_USERS",
            controlType: "SECTION",
            children: [
              {
                identifier: "limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Limit",
                configProperty: "actionConfiguration.formData.limit",
                initialValue: "10",
                placeholderText: "10",
                tooltipText: "The number of users to retrieve. ",
                subtitle: "The maximum number of results per page.",
              },
              {
                identifier: "after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "Next page token",
                configProperty: "actionConfiguration.formData.after",
                requiresEncoding: true,
                tooltipText:
                  "The token returned in the cursor field of the response.",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                placeholderText: "Q0o3TjhRVQ%3D%3D",
              },
            ],
            name: "Retrieve list users",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'RETRIEVE_LIST_USERS'}}",
            },
          },
          {
            identifier: "ARCHIVE_TABLE",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableIdOrName",
                label: "Table ID or name",
                requiresEncoding: true,
                subtitle: "Table name or ID to archive.",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                isRequired: true,
                placeholderText: "test_table",
              },
            ],
            name: "Archive table",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'ARCHIVE_TABLE'}}",
            },
          },
          {
            identifier: "PERMANENTLY_DELETE_A_ROW",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                isRequired: true,
                requiresEncoding: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
              },
              {
                identifier: "rowId",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "The ID of the row. ",
                subtitle: "Row ID.  ",
                placeholderText: "5378084",
                label: "Row ID",
                configProperty: "actionConfiguration.formData.rowId",
              },
            ],
            name: "Permanently Delete a Row",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'PERMANENTLY_DELETE_A_ROW'}}",
            },
          },
          {
            identifier: "GET_SET_ROWS",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table ID or name. ",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.inputs",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "inputs",
                label: "Inputs",
                placeholderText: "[”5378084”,”71003521”]",
                subtitle: "List with row IDs ",
                tooltipText: "ID rows that want to get. type: array.",
                isRequired: true,
                requiresEncoding: false,
              },
            ],
            name: "Get Set rows",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_SET_ROWS'}}",
            },
          },
          {
            identifier: "CREATE_A_REDIRECT",
            controlType: "SECTION",
            children: [
              {
                identifier: "routePrefix",
                isRequired: true,
                requiresEncoding: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The incoming URL, path, or pattern to match. If you do not remember how its looks, you can use get current redirects to find routePrefix examples.",
                subtitle: "Incoming URL, path or pattern to match.",
                placeholderText: "/the-original-source",
                label: "Route prefix",
                configProperty: "actionConfiguration.formData.routePrefix",
              },
              {
                identifier: "destination",
                isRequired: true,
                requiresEncoding: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The destination URL, where the target URL should be redirected if it matches the routePrefix. If you do not remember how its looks, you can use get current redirects to find destination examples.",
                subtitle: "Destination URL",
                placeholderText:
                  "http://62515.sites.hubspot.com/the-destination-url",
                label: "Destination",
                configProperty: "actionConfiguration.formData.destination",
              },
              {
                identifier: "redirectStyle",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The type of redirect to create. Options include: 301 (permanent), 302 (temporary), or 305 (proxy). ",
                subtitle: "Type of redirect to create. ",
                placeholderText: "301",
                label: "Redirect style",
                initialValue: "301",
                configProperty: "actionConfiguration.formData.redirectStyle",
              },
              {
                identifier: "precedence",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Used to prioritize URL redirection. If a given URL matches more than one redirect, the one with the lower precedence will be used. ",
                subtitle: "Prioritize URL redirection. ",
                placeholderText: "0",
                label: "Precedence",
                initialValue: "0",
                configProperty: "actionConfiguration.formData.precedence",
              },
              {
                identifier: "isOnlyAfterNotFound",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Whether the URL redirect mapping should apply only if a live page on the URL isn't found. If False, the URL redirect mapping will take precedence over any existing page.",
                subtitle:
                  "If true, URL redirect mapping should apply only if a live page on the URL isn't found. ",
                placeholderText: "false",
                label: " Is only after not found",
                initialValue: "false",
                configProperty:
                  "actionConfiguration.formData.isOnlyAfterNotFound",
              },
              {
                identifier: "isMatchFullUrl",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "If true, the 'routePrefix' should match on the entire URL including the domain. ",
                subtitle:
                  "If true, the 'routePrefix' should match on the entire URL including the domain.",
                placeholderText: "false",
                label: "Is match full URL",
                initialValue: "false",
                configProperty: "actionConfiguration.formData.isMatchFullUrl",
              },
              {
                identifier: "isMatchQueryString",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "If true, the 'routePrefix' should match on the entire URL path including the query string. ",
                subtitle:
                  "If true 'routePrefix' should match on the entire URL path. ",
                placeholderText: "false",
                label: "Is match query string",
                initialValue: "false",
                configProperty:
                  "actionConfiguration.formData.isMatchQueryString",
              },
              {
                identifier: "isPattern",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Set to true if you are creating a flexible pattern based URL mapping. ",
                subtitle:
                  "If true, create a flexible pattern based URL mapping. ",
                placeholderText: "false",
                label: "Is pattern",
                initialValue: "false",
                configProperty: "actionConfiguration.formData.isPattern",
              },
              {
                identifier: "isTrailingSlashOptional",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Whether a trailing slash will be ignored. ",
                subtitle: "If true, a trailing slash will be ignored. ",
                placeholderText: "false",
                label: "Is trailing slash optional ",
                initialValue: "false",
                configProperty:
                  "actionConfiguration.formData.isTrailingSlashOptional",
              },
              {
                identifier: "isProtocolAgnostic",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Whether the routePrefix  should match both HTTP and HTTPS protocols. ",
                subtitle:
                  "If true,  the routePrefixmatch both HTTP and HTTPS protocols. ",
                placeholderText: "false",
                label: "Is protocol agnostic",
                initialValue: "false",
                configProperty:
                  "actionConfiguration.formData.isProtocolAgnostic",
              },
            ],
            name: "Create a redirect",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_A_REDIRECT'}}",
            },
          },
          {
            identifier: "RETRIEVES_USER",
            controlType: "SECTION",
            children: [
              {
                identifier: "idProperty",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "ID property",
                configProperty: "actionConfiguration.formData.idProperty",
                tooltipText:
                  "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL.",
                subtitle: "Name of a property with unique user values.",
              },
              {
                identifier: "userId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "User ID",
                configProperty: "actionConfiguration.formData.userId",
                isRequired: true,
                tooltipText: "Identifier of user to retrieve. ",
                subtitle: "Identifier of user to retrieve. ",
                placeholderText: "13358977",
              },
            ],
            name: "Retrieves User",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'RETRIEVES_USER'}}",
            },
          },
          {
            identifier: "UPDATE_EXISTING_ROW",
            controlType: "SECTION",
            children: [
              {
                identifier: "tableIdOrName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                subtitle: "Table name or ID to return  details.",
                placeholderText: "test_table",
                label: "Table ID or name",
                configProperty: "actionConfiguration.formData.tableIdOrName",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.rowId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "rowId",
                label: "Row ID",
                placeholderText: "5378084",
                subtitle: "Row ID. ",
                tooltipText: "The ID of the row. ",
                isRequired: true,
              },
              {
                configProperty: "actionConfiguration.formData.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "path",
                label: "Path",
                placeholderText: "test_path",
                subtitle: "The value for hs_path column.",
                tooltipText:
                  "Value for hs_path  column, which will be used as slug in the dynamic pages. ",
                requiresEncoding: false,
                initialValue: "null",
              },
              {
                configProperty: "actionConfiguration.formData.name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "name",
                label: "Name",
                subtitle: "Value for hs_name column.",
                tooltipText:
                  "Value for hs_name  column, which will be used as title in the dynamic pages.",
                placeholderText: "text_title",
                initialValue: "null",
                requiresEncoding: false,
              },
              {
                configProperty: "actionConfiguration.formData.childTableId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "childTableId",
                label: "Child table ID",
                placeholderText: "5378084",
                subtitle: "Value for the column child table id.",
                tooltipText: "Value for the column child table id.",
                initialValue: "null",
              },
              {
                configProperty: "actionConfiguration.formData.values",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "values",
                isRequired: true,
                label: "Values",
                placeholderText:
                  '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                requiresEncoding: false,
                subtitle: "Key value pairs. ",
                tooltipText:
                  "List of key value pairs with the column name and column value. type: array.",
              },
            ],
            name: "Update Existing Row",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_EXISTING_ROW'}}",
            },
          },
          {
            identifier: "GET_PUBLISHED_TABLES",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "sort",
                label: "Sort",
                subtitle:
                  "Fields to use for sorting results. array with fields to use for sorting results.",
                tooltipText:
                  "Fields to use for sorting results. Valid fields are name, createdAt, updatedAt, createdBy, updatedBy. createdAt will be used by default. type: array.",
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.after",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "after",
                label: "Next page token",
                subtitle:
                  "To obtain the token look for the next page token or after field, in the response.",
                tooltipText:
                  "The token returned in the cursor field of the response.",
                requiresEncoding: true,
                placeholderText: "MTA%3D",
              },
              {
                configProperty: "actionConfiguration.formData.limit",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "limit",
                initialValue: "1000",
                label: "Limit",
                placeholderText: "10",
                subtitle: "The maximum number of published tables to return. ",
                tooltipText:
                  "Maximum number of results to return. Default is 1000.",
              },
              {
                configProperty: "actionConfiguration.formData.createdAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAt",
                label: "Created at",
                placeholderText: "2019-03-15T21:20:51.556Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains created at this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText:
                  "Only return tables created at exactly the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.createdAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdAfter",
                label: "Created after",
                placeholderText: "2019-03-15T21:20:51.556Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ. ",
                tooltipText:
                  "Only return tables created after the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.createdBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "createdBefore",
                label: "Created before",
                placeholderText: "2019-03-15T21:20:51.556Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText:
                  "Only return tables created before the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAt",
                label: "Updated at",
                placeholderText: "2020-04-02T16:00:43.880Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText:
                  "Only return tables last updated at exactly the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedAfter",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedAfter",
                label: "Updated after",
                placeholderText: "2020-04-02T16:00:43.880Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText:
                  "Only return tables last updated after the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.updatedBefore",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "updatedBefore",
                label: "Updated before",
                placeholderText: "2020-04-02T16:00:43.880Z",
                requiresEncoding: true,
                subtitle:
                  "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                tooltipText:
                  "Only return tables last updated before the specified time. ",
              },
              {
                configProperty: "actionConfiguration.formData.archived",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "archived",
                initialValue: "false",
                label: "Archive",
                placeholderText: "false",
                requiresEncoding: false,
                subtitle: "Whether to return only archived results.",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
              },
            ],
            name: "Get published tables",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_PUBLISHED_TABLES'}}",
            },
          },
          {
            identifier: "LIST_OBJECTS",
            controlType: "SECTION",
            children: [
              {
                identifier: "objectType",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText:
                  "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                subtitle: "Valid object type for the CRM.",
                label: "Object type",
                placeholderText: "contacts",
                configProperty: "actionConfiguration.formData.objectType",
              },
            ],
            name: "List objects",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'LIST_OBJECTS'}}",
            },
          },
          {
            identifier: "UPDATE_FOLDER_PROPERTIES",
            controlType: "SECTION",
            children: [
              {
                identifier: "id",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText: "Identifier of the folder to change. ",
                subtitle: "Folder ID to change.",
                label: "ID",
                placeholderText: "74302751362",
                configProperty: "actionConfiguration.formData.id",
              },
              {
                identifier: "name",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "New name. If specified the folder's name and fullPath will change. All children of the folder will be updated accordingly.",
                subtitle: "New folder name. ",
                label: "Name",
                placeholderText: "myNewFolder",
                configProperty: "actionConfiguration.formData.name",
              },
              {
                identifier: "parentFolderId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                requiresEncoding: true,
                tooltipText:
                  "New parent folder ID. If changed, the folder and all it's children will be moved into the specified folder. parentFolderId and parentFolderPath cannot be specified at the same time.  ",
                subtitle: "New parent folder ID. ",
                label: "Parent folder ID",
                placeholderText: "/myFolder",
                configProperty: "actionConfiguration.formData.parentFolderId",
              },
            ],
            name: "Update folder Properties",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_FOLDER_PROPERTIES'}}",
            },
          },
          {
            identifier: "GET_SINGLE_DOMAINS",
            controlType: "SECTION",
            children: [
              {
                identifier: "archived",
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Specifies whether to return archived tables. Defaults to false. ",
                subtitle: "Whether to return only archived results.",
                label: "Archived",
                configProperty: "actionConfiguration.formData.archived",
                placeholderText: "false",
                initialValue: "false",
              },
              {
                identifier: "Id",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "The unique ID of the domain. ",
                subtitle: "The ID or name of the domain.",
                label: "ID",
                configProperty: "actionConfiguration.formData.Id",
                requiresEncoding: true,
                placeholderText: "789442651352",
              },
            ],
            name: "Get Single Domains",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'GET_SINGLE_DOMAINS'}}",
            },
          },
          {
            identifier: "MODIFY_USER",
            controlType: "SECTION",
            children: [
              {
                identifier: "idProperty",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "ID property",
                configProperty: "actionConfiguration.formData.idProperty",
                tooltipText:
                  "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL. ",
                subtitle: "Name of a property with unique user values.",
              },
              {
                identifier: "userId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                label: "User ID",
                configProperty: "actionConfiguration.formData.userId",
                isRequired: true,
                tooltipText: "Identifier of user to retrieve. ",
                subtitle: "Identifier of user to retrieve.",
                placeholderText: "13358977",
              },
              {
                configProperty: "actionConfiguration.formData.roleId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "roleId",
                initialValue: "null",
                label: "Role ID",
                placeholderText: "310427",
                tooltipText: "The user's role. ",
                subtitle: "User role ID. ",
              },
              {
                configProperty: "actionConfiguration.formData.primaryTeamId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "primaryTeamId",
                initialValue: "null",
                label: "Primary team ID",
                placeholderText: "7824745",
                tooltipText: "The user's primary team. ",
                subtitle: "User primary team ID. ",
              },
              {
                configProperty: "actionConfiguration.formData.secondaryTeamIds",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "secondaryTeamIds",
                initialValue: "[]",
                label: "Secondary team IDs",
                placeholderText: "[”7885423”,”78525623”]",
                tooltipText: "The user's additional teams. type: array",
                subtitle: "User additional teams IDs.  ",
              },
            ],
            name: "Modify User",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'MODIFY_USER'}}",
            },
          },
        ],
      },
      datasourceUiConfig: {
        form: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Authentication type",
                description: "Select the authentication type to use",
                configProperty:
                  "datasourceConfiguration.authentication.authenticationType",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "Bearer token",
                    value: "bearerToken",
                  },
                ],
              },
              {
                identifier: "bearerToken",
                label: "Bearer token",
                configProperty:
                  "datasourceConfiguration.authentication.bearerToken",
                controlType: "INPUT_TEXT",
                dataType: "PASSWORD",
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "bearerToken",
                },
              },
            ],
          },
        ],
      },
      templates: {},
      remotePlugin: true,
      new: false,
    },
    {
      id: "65e58e1296506a506bd706c7",
      userPermissions: [],
      name: "Twilio",
      type: "REMOTE",
      packageName: "saas-plugin",
      pluginName: "twilio-1.2-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/twilio1.png",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/twilio#create-queries",
      responseType: "JSON",
      version: "1.0",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: true,
      requiresDatasource: true,
      actionUiConfig: {
        editor: [
          {
            label: "Command",
            description: "Select the method to run",
            configProperty: "actionConfiguration.formData.command",
            controlType: "DROP_DOWN",
            options: [
              {
                index: 1,
                label: "Create message",
                value: "CREATE_MESSAGE",
              },
              {
                index: 2,
                label: "Schedule message",
                value: "SCHEDULE_MESSAGE",
              },
              {
                index: 3,
                label: "List message",
                value: "LIST_MESSAGE",
              },
              {
                index: 4,
                label: "Fetch message",
                value: "FETCH_MESSAGE",
              },
              {
                index: 5,
                label: "Delete message",
                value: "DELETE_MESSAGE",
              },
              {
                index: 6,
                label: "Cancel message",
                value: "CANCEL_MESSAGE",
              },
            ],
          },
          {
            identifier: "SCHEDULE_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "TWILIO_ACCOUNT_SID",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The SID of the account that will create the resource.",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                label: "Twilio account SID",
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
              },
              {
                identifier: "MessagingServiceSid",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The SID of the messaging Service  used with the message. The value is null if a messaging Service was not used.",
                subtitle:
                  "Specify the SID of the messaging Service used with the message.",
                label: "Messaging service SID",
                configProperty:
                  "actionConfiguration.formData.MessagingServiceSid",
                placeholderText: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
              },
              {
                identifier: "To",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The destination phone number in E.164 format for SMS/MMS or channel user address for other 3rd-party channels.",
                subtitle: "Destination phone number",
                label: "To",
                configProperty: "actionConfiguration.formData.To",
                placeholderText: "+123456789",
              },
              {
                identifier: "Body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The message text. Can be up to 1,600 characters long.",
                subtitle: "Specify the message text",
                placeholderText: "Hi there",
                label: "Body",
                configProperty: "actionConfiguration.formData.Body",
                isRequired: true,
                requiresEncoding: true,
              },
              {
                configProperty: "actionConfiguration.formData.SendAt",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "SendAt",
                isRequired: true,
                label: "Send at",
                placeholderText: "2021-11-30T20:36:27Z",
                requiresEncoding: true,
                subtitle:
                  "Define the time that Twilio will send the message. Must be in UTC format: YYYY-MM-DDTHH:MM:SSZ",
                tooltipText:
                  "The time that Twilio will send the message. Must be in UTC format.",
              },
            ],
            name: "Schedule message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'SCHEDULE_MESSAGE'}}",
            },
          },
          {
            identifier: "LIST_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "To",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Read messages sent to only this phone number.",
                subtitle: "Destination phone number",
                label: "To",
                configProperty: "actionConfiguration.formData.To",
                placeholderText: "+123456789",
                requiresEncoding: true,
              },
              {
                identifier: "From",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Read messages sent from only this phone number or alphanumeric sender ID.",
                subtitle: "Read messages sent from only this phone number.",
                label: "From",
                configProperty: "actionConfiguration.formData.From",
                placeholderText: "+123456789",
                requiresEncoding: true,
              },
              {
                identifier: "DateSent",
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The date of the messages to show. Specify a date as YYYY-MM-DD in GMT to read only messages sent on this date. For example: 2009-07-06. ",
                subtitle: "Define the date of the messages to show",
                label: "DateSent",
                configProperty: "actionConfiguration.formData.DateSent",
                placeholderText: "YYYY-MM-DD",
              },
              {
                identifier: "PageSize",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Number of records to pull.",
                subtitle: "Write the number of records to pull",
                placeholderText: "{{ table1.pageSize }}",
                label: "Page size",
                configProperty: "actionConfiguration.formData.PageSize",
                requiresEncoding: false,
                initialValue: "2",
              },
              {
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "TWILIO_ACCOUNT_SID",
                isRequired: true,
                label: "Twilio account SID",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                tooltipText:
                  "The SID of the account that will fetch the resource.",
              },
            ],
            name: "List message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'LIST_MESSAGE'}}",
            },
          },
          {
            identifier: "FETCH_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "TWILIO_ACCOUNT_SID",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The SID of the account that will fetch the resource.",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                label: "Twilio account SID",
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
              },
              {
                configProperty: "actionConfiguration.formData.MESSAGE_SID",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "MESSAGE_SID",
                isRequired: true,
                label: "Message SID",
                placeholderText: "MMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                subtitle: "Specify the SID of the message.",
                tooltipText:
                  "The Twilio-provided string that uniquely identifies the message resource to fetch.",
              },
            ],
            name: "Fetch message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'FETCH_MESSAGE'}}",
            },
          },
          {
            identifier: "CREATE_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "TWILIO_ACCOUNT_SID",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The SID of the account that will create the resource.",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                label: "Twilio account SID",
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
              },
              {
                configProperty: "actionConfiguration.formData.To",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "To",
                isRequired: true,
                label: "To",
                placeholderText: "+123456789",
                requiresEncoding: true,
                subtitle: "Destination phone number",
                tooltipText:
                  "The destination phone number in E.164 format for SMS/MMS or channel user address for other 3rd-party channels.",
              },
              {
                configProperty: "actionConfiguration.formData.Fom",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "Fom",
                isRequired: true,
                label: "From",
                placeholderText: "+123456789",
                requiresEncoding: true,
                subtitle: "Write a Twilio phone number",
                tooltipText:
                  "A Twilio phone number in E.164 format, an alphanumeric sender ID, or a channel Endpoint address that is enabled for the type of message you want to send. Phone numbers or short codes purchased from Twilio also work here. You cannot, for example, spoof messages from a private cell phone number. If you are using messaging_service_sid, this parameter must be empty.",
              },
              {
                configProperty: "actionConfiguration.formData.Body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "Body",
                isRequired: true,
                label: "Body",
                placeholderText: "Hi there",
                requiresEncoding: true,
                subtitle: "Specify the message text",
                tooltipText:
                  "The message text. Can be up to 1,600 characters long.",
              },
            ],
            name: "Create message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_MESSAGE'}}",
            },
          },
          {
            identifier: "CANCEL_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "TWILIO_ACCOUNT_SID",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText:
                  "The SID of the account that will update the resource.",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                label: "Twilio account SID",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
              },
              {
                identifier: "MESSAGE_SID",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText:
                  "The Twilio-provided string that uniquely identifies the message resource to fetch.",
                subtitle: "Specify the SID of the message.",
                label: "Message SID",
                placeholderText: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                configProperty: "actionConfiguration.formData.MESSAGE_SID",
              },
            ],
            name: "Cancel message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CANCEL_MESSAGE'}}",
            },
          },
          {
            identifier: "DELETE_MESSAGE",
            controlType: "SECTION",
            children: [
              {
                identifier: "TWILIO_ACCOUNT_SID",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The SID of the account that created the message resources to delete.",
                subtitle:
                  "Specify the SID of the account. This is the same value used at datasource creation.",
                placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                label: "Twilio account SID",
                configProperty:
                  "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
              },
              {
                configProperty: "actionConfiguration.formData.MESSAGE_SID",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "MESSAGE_SID",
                isRequired: true,
                label: "Message SID",
                placeholderText: "MMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                subtitle: "Specify the SID of the message.",
                tooltipText:
                  "The Twilio-provided string that uniquely identifies the message resource to delete.",
              },
            ],
            name: "Delete message",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'DELETE_MESSAGE'}}",
            },
          },
        ],
      },
      datasourceUiConfig: {
        form: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Authentication type",
                description: "Select the authentication type to use",
                configProperty:
                  "datasourceConfiguration.authentication.authenticationType",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "Basic auth",
                    value: "basic",
                  },
                ],
              },
              {
                identifier: "username",
                label: "Account SID",
                configProperty:
                  "datasourceConfiguration.authentication.username",
                controlType: "INPUT_TEXT",
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "basic",
                },
              },
              {
                identifier: "password",
                label: "Auth token",
                configProperty:
                  "datasourceConfiguration.authentication.password",
                controlType: "INPUT_TEXT",
                dataType: "PASSWORD",
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "basic",
                },
              },
            ],
          },
        ],
      },
      templates: {},
      remotePlugin: true,
      new: false,
    },
    {
      id: "65e58e1296506a506bd706c8",
      userPermissions: [],
      name: "Airtable",
      type: "REMOTE",
      packageName: "saas-plugin",
      pluginName: "airtable-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/airtable.svg",
      documentationLink:
        "https://docs.appsmith.com/reference/datasources/airtable#create-queries",
      responseType: "JSON",
      version: "1.0",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "AutoForm",
      allowUserDatasources: true,
      isRemotePlugin: true,
      requiresDatasource: true,
      actionUiConfig: {
        editor: [
          {
            label: "Command",
            description: "Select the method to run",
            configProperty: "actionConfiguration.formData.command",
            controlType: "DROP_DOWN",
            options: [
              {
                index: 1,
                label: "List records",
                value: "LIST_RECORDS",
              },
              {
                index: 2,
                label: "Create records",
                value: "CREATE_RECORDS",
              },
              {
                index: 3,
                label: "Delete a record",
                value: "DELETE_A_RECORD",
              },
              {
                index: 4,
                label: "Retrieve a record",
                value: "RETRIEVE_A_RECORD",
              },
              {
                index: 5,
                label: "Update records",
                value: "UPDATE_RECORDS",
              },
            ],
          },
          {
            identifier: "UPDATE_RECORDS",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.baseId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "baseId",
                isRequired: true,
                label: "Base ID",
                tooltipText: "ID of Airtable base. type: String",
                subtitle: "Airtable ID. Example: appXXXXXXXXX",
                placeholderText: "appXXXXXXXXX",
              },
              {
                configProperty: "actionConfiguration.formData.tableName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableName",
                isRequired: true,
                label: "Table name",
                requiresEncoding: true,
                tooltipText: "Name of table in Airtable base. type: String",
                subtitle: "Table name. Example: Projects",
                placeholderText: "Table name",
              },
              {
                configProperty: "actionConfiguration.formData.records",
                controlType: "QUERY_DYNAMIC_TEXT",
                identifier: "records",
                label: "Records",
                isRequired: true,
                placeholderText:
                  '[{ "id": "recehWFQ9T7NUZzF4", "fields": { "name": "Test" }}]',
                tooltipText: "Enter records for update. type: array",
                subtitle:
                  'Records to add in the table. Example: [{ "fields": { "name": "Test" }}]',
              },
            ],
            name: "Update records",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'UPDATE_RECORDS'}}",
            },
          },
          {
            identifier: "DELETE_A_RECORD",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.baseId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "baseId",
                isRequired: true,
                label: "Base ID",
                tooltipText: "ID of Airtable base. type: Strng",
                subtitle: "Airtable ID. Example: appXXXXXXXXX",
                placeholderText: "appXXXXXXXXX",
              },
              {
                configProperty: "actionConfiguration.formData.tableName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableName",
                isRequired: true,
                label: "Table name",
                requiresEncoding: true,
                tooltipText: "Name of table in Airtable base. type: String",
                subtitle: "Table name. Example: Projects",
                placeholderText: "Table name",
              },
              {
                configProperty: "actionConfiguration.formData.recordId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "recordId",
                isRequired: true,
                label: "Record ID",
                tooltipText: "ID of record to be deleted. type: String",
                subtitle: "Record ID. Example: recXXXXXXXXXX",
                placeholderText: "recXXXXXXXXX",
              },
            ],
            name: "Delete a record",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'DELETE_A_RECORD'}}",
            },
          },
          {
            identifier: "CREATE_RECORDS",
            controlType: "SECTION",
            children: [
              {
                identifier: "baseId",
                isRequired: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "ID of the Airtable base. type: String",
                subtitle: "Airtable ID. Example: appXXXXXXXXX",
                placeholderText: "appXXXXXXXXX",
                label: "Base ID",
                configProperty: "actionConfiguration.formData.baseId",
              },
              {
                identifier: "tableName",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Name of table in Airtable base. type: String",
                subtitle: "Table name. Example: Projects",
                placeholderText: "Table name",
                label: "Table name",
                configProperty: "actionConfiguration.formData.tableName",
              },
              {
                identifier: "records",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText: "Enter records for creation. type: array",
                subtitle:
                  'Records to add in the table. Example: [{ "fields": { "name": "Test" }}]',
                label: "Records",
                placeholderText: '[{ "fields": { "name": "Test" }}]',
                configProperty: "actionConfiguration.formData.records",
              },
            ],
            name: "Create records",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'CREATE_RECORDS'}}",
            },
          },
          {
            identifier: "LIST_RECORDS",
            controlType: "SECTION",
            children: [
              {
                identifier: "baseId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                tooltipText: "ID of Airtable base. type: String",
                subtitle: "Airtable ID. Example: appXXXXXXXXX",
                label: "Base ID ",
                placeholderText: "appXXXXXXXXX",
                configProperty: "actionConfiguration.formData.baseId",
              },
              {
                identifier: "tableName",
                isRequired: true,
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText: "Name of table in Airtable base. type: String",
                subtitle: "Table name. Example: Projects",
                placeholderText: "Table name",
                label: "Table name",
                configProperty: "actionConfiguration.formData.tableName",
              },
              {
                identifier: "fields",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "Only data for fields whose names are in this list will be included in the result. If you don't need every field, you can use this parameter to reduce the amount of data transferred. type: array",
                subtitle:
                  "Only data for fields whose names are in this list will be included in the result. ",
                label: "Fields",
                configProperty: "actionConfiguration.formData.fields",
              },
              {
                identifier: "filterByFormula",
                requiresEncoding: true,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  'A formula used to filter records. The formula will be evaluated for each record, and if the result is not 0,                   false,"",NaN,[], or #Error!the record will be included in the response. type: String',
                subtitle: "A formula used to filter records.",
                label: "Filter by formula",
                configProperty: "actionConfiguration.formData.filterByFormula",
              },
              {
                identifier: "maxRecords",
                isRequired: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The maximum total number of records that will be returned in your requests. If this value is larger than pageSize(which is 100 by default), you may have to load multiple pages to reach this total. type: integer",
                subtitle: "Maximum number of records to return. Example: 100",
                placeholderText: "100",
                label: "Max records",
                configProperty: "actionConfiguration.formData.maxRecords",
              },
              {
                identifier: "pageSize",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The number of records returned in each request. Must be less than or equal to 100. Default is 100. See the Pagination section below for more. type: Number",
                subtitle: "Maximum number of results to return. Example: 100",
                placeholderText: "100",
                label: "Page size",
                initialValue: "100",
                configProperty: "actionConfiguration.formData.pageSize",
              },
              {
                identifier: "sort",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  'A list of sort objects that specifies how the records will be ordered. Each sort object must have a field               key specifying the name of the field to sort on, and an optional directionkey that is either "asc" or "desc". The default direction is "asc". type: array',
                subtitle: "Columns names to sort the result by.",
                label: "Sort",
                configProperty: "actionConfiguration.formData.sort",
              },
              {
                identifier: "view",
                isRequired: false,
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The name or ID of a view in the tableName. If set, only the records in that view will be returned. type: String",
                subtitle:
                  "The name or ID of a view in the tableName. Example: GridView",
                label: "View",
                configProperty: "actionConfiguration.formData.view",
              },
              {
                identifier: "cellFormat",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The format that should be used for cell values. Supported values are: json and string. The default is json. type: String",
                subtitle: "Format to used for cell values. Example: json",
                label: "Cell format",
                configProperty: "actionConfiguration.formData.cellFormat",
              },
              {
                identifier: "timeZone",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The time zone that should be used to format dates when using string as the cellFormat. This parameter is required when using string as the cellFormat. type: String",
                subtitle:
                  "time zone that should be used to format dates when using string as the cellFormat",
                label: "Time zone",
                configProperty: "actionConfiguration.formData.timeZone",
              },
              {
                identifier: "userLocale",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "The user locale that should be used to format dates when using string as the cellFormat. This parameter is required when using string as the cellFormat. type: String",
                subtitle:
                  " user locale that should be used to format dates when using string as the cellFormat.",
                label: "User locale",
                configProperty: "actionConfiguration.formData.userLocale",
              },
              {
                identifier: "offset",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                tooltipText:
                  "If there are more records, the response will contain an offset.To fetch the next page of records, include offset in the next request's parameters. Pagination will stop when you've reached the end of your table. If the maxRecords parameter is passed, pagination will stop once you've reached this maximum. type: String",
                subtitle:
                  "Paging cursor token to get the next set of results. Example: itrZ5o03g2WP95ntX/recvKqNLuVajJw9MY.",
                label: "Offset",
                configProperty: "actionConfiguration.formData.offset",
              },
            ],
            name: "List records",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'LIST_RECORDS'}}",
            },
          },
          {
            identifier: "RETRIEVE_A_RECORD",
            controlType: "SECTION",
            children: [
              {
                configProperty: "actionConfiguration.formData.baseId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "baseId",
                isRequired: true,
                label: "Base ID",
                tooltipText: "ID of Airtable base. type: String",
                subtitle: "Airtable ID. Example: appXXXXXXXXX",
                placeholderText: "appXXXXXXXXX",
              },
              {
                configProperty: "actionConfiguration.formData.tableName",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "tableName",
                isRequired: true,
                label: "Table name",
                requiresEncoding: true,
                tooltipText: "Name of table in Airtable base. type: String",
                subtitle: "Table name. Example: Projects",
                placeholderText: "Table name",
              },
              {
                configProperty: "actionConfiguration.formData.recordId",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                identifier: "recordId",
                label: "Record ID ",
                isRequired: true,
                tooltipText: "Record ID you want to retrieve. type: String",
                subtitle: "Record ID. Example: recXXXXXXXXXX",
                placeholderText: "recXXXXXXXXX",
              },
            ],
            name: "Retrieve a record",
            conditionals: {
              show: "{{actionConfiguration.formData.command === 'RETRIEVE_A_RECORD'}}",
            },
          },
        ],
      },
      datasourceUiConfig: {
        form: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Authentication type",
                description: "Select the authentication type to use",
                configProperty:
                  "datasourceConfiguration.authentication.authenticationType",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "API key",
                    value: "apiKey",
                  },
                  {
                    label: "Personal access token",
                    value: "bearerToken",
                  },
                ],
              },
              {
                identifier: "bearerToken",
                label: "Bearer token",
                configProperty:
                  "datasourceConfiguration.authentication.bearerToken",
                controlType: "INPUT_TEXT",
                dataType: "PASSWORD",
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "bearerToken",
                },
              },
              {
                identifier: "apiKey",
                label: "Api key",
                configProperty: "datasourceConfiguration.authentication.value",
                controlType: "INPUT_TEXT",
                dataType: "PASSWORD",
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "apiKey",
                },
              },
            ],
          },
        ],
      },
      templates: {},
      remotePlugin: true,
      new: false,
    },
    {
      id: "65e58fe2225bee69e71c536a",
      name: "Appsmith AI",
      type: "AI",
      packageName: "appsmithai-plugin",
      iconLocation: "https://assets.appsmith.com/logo/appsmith-ai.svg",
      documentationLink:
        "https://docs.appsmith.com/connect-data/reference/appsmith-ai",
      responseType: "JSON",
      uiComponent: "UQIDbEditorForm",
      datasourceComponent: "DbEditorForm",
      allowUserDatasources: true,
      templates: {},
      requiresDatasource: true,
    },
  ],
  defaultPluginList: [
    {
      id: "65e58df196506a506bd7069c",
      userPermissions: [],
      name: "PostgreSQL",
      packageName: "postgres-plugin",
      iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df196506a506bd7069d",
      userPermissions: [],
      name: "REST API",
      packageName: "restapi-plugin",
      iconLocation: "https://assets.appsmith.com/RestAPI.png",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df196506a506bd7069e",
      userPermissions: [],
      name: "MongoDB",
      packageName: "mongo-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mongodb.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd7069f",
      userPermissions: [],
      name: "MySQL",
      packageName: "mysql-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mysql.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a2",
      userPermissions: [],
      name: "Elasticsearch",
      packageName: "elasticsearch-plugin",
      iconLocation: "https://assets.appsmith.com/logo/elastic.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a3",
      userPermissions: [],
      name: "DynamoDB",
      packageName: "dynamo-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-dynamodb.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a4",
      userPermissions: [],
      name: "Redis",
      packageName: "redis-plugin",
      iconLocation: "https://assets.appsmith.com/logo/redis.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a5",
      userPermissions: [],
      name: "Microsoft SQL Server",
      packageName: "mssql-plugin",
      iconLocation: "https://assets.appsmith.com/logo/mssql.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a6",
      userPermissions: [],
      name: "Firestore",
      packageName: "firestore-plugin",
      iconLocation: "https://assets.appsmith.com/logo/firestore.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a7",
      userPermissions: [],
      name: "Redshift",
      packageName: "redshift-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-redshift.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a8",
      userPermissions: [],
      name: "S3",
      packageName: "amazons3-plugin",
      iconLocation: "https://assets.appsmith.com/logo/aws-s3.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706a9",
      userPermissions: [],
      name: "Google Sheets",
      packageName: "google-sheets-plugin",
      iconLocation: "https://assets.appsmith.com/GoogleSheets.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706ab",
      userPermissions: [],
      name: "Snowflake",
      packageName: "snowflake-plugin",
      iconLocation: "https://assets.appsmith.com/logo/snowflake.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706ac",
      userPermissions: [],
      name: "ArangoDB",
      packageName: "arangodb-plugin",
      iconLocation: "https://assets.appsmith.com/logo/arangodb.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706ad",
      userPermissions: [],
      name: "JS Functions",
      packageName: "js-plugin",
      iconLocation: "https://assets.appsmith.com/js-yellow.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df296506a506bd706ae",
      userPermissions: [],
      name: "SMTP",
      packageName: "smtp-plugin",
      iconLocation: "https://assets.appsmith.com/smtp-icon.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706be",
      userPermissions: [],
      name: "Authenticated GraphQL API",
      packageName: "graphql-plugin",
      iconLocation:
        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706bf",
      userPermissions: [],
      name: "Oracle",
      packageName: "oracle-plugin",
      iconLocation:
        "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706c1",
      userPermissions: [],
      name: "Open AI",
      packageName: "openai-plugin",
      iconLocation: "https://assets.appsmith.com/logo/open-ai.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706c2",
      userPermissions: [],
      name: "Anthropic",
      packageName: "anthropic-plugin",
      iconLocation: "https://assets.appsmith.com/logo/anthropic.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706c3",
      userPermissions: [],
      name: "Google AI",
      packageName: "googleai-plugin",
      iconLocation: "https://assets.appsmith.com/google-ai.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706c4",
      userPermissions: [],
      name: "Databricks",
      packageName: "databricks-plugin",
      iconLocation: "https://assets.appsmith.com/databricks-logo.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58df396506a506bd706c5",
      userPermissions: [],
      name: "AWS Lambda",
      packageName: "aws-lambda-plugin",
      iconLocation: "https://assets.appsmith.com/aws-lambda-logo.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58e1296506a506bd706c6",
      userPermissions: [],
      name: "HubSpot",
      packageName: "saas-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/hubspot.png",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58e1296506a506bd706c7",
      userPermissions: [],
      name: "Twilio",
      packageName: "saas-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/twilio1.png",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58e1296506a506bd706c8",
      userPermissions: [],
      name: "Airtable",
      packageName: "saas-plugin",
      iconLocation: "https://assets.appsmith.com/integrations/airtable.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
    {
      id: "65e58fe2225bee69e71c536a",
      userPermissions: [],
      name: "Appsmith AI",
      packageName: "appsmithai-plugin",
      iconLocation: "https://assets.appsmith.com/logo/appsmith-ai.svg",
      allowUserDatasources: true,
      isRemotePlugin: false,
      remotePlugin: false,
      new: false,
    },
  ],
  loading: false,
  formConfigs: {
    "65e58df196506a506bd7069d": [
      {
        sectionName: "General",
        children: [
          {
            label: "URL",
            configProperty: "datasourceConfiguration.url",
            controlType: "INPUT_TEXT",
            isRequired: true,
            placeholderText: "https://example.com",
          },
          {
            label: "Headers",
            configProperty: "datasourceConfiguration.headers",
            controlType: "KEYVALUE_ARRAY",
          },
          {
            label: "Query Params",
            configProperty: "datasourceConfiguration.queryParameters",
            controlType: "KEYVALUE_ARRAY",
          },
          {
            label: "Send authentication Information key (do not edit)",
            configProperty: "datasourceConfiguration.properties[0].key",
            controlType: "INPUT_TEXT",
            hidden: true,
            initialValue: "isSendSessionEnabled",
          },
          {
            label: "Send Appsmith signature header (X-APPSMITH-SIGNATURE)",
            configProperty: "datasourceConfiguration.properties[0].value",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: "N",
            options: [
              {
                label: "Yes",
                value: "Y",
              },
              {
                label: "No",
                value: "N",
              },
            ],
          },
          {
            label: "Session details signature key key (do not edit)",
            configProperty: "datasourceConfiguration.properties[1].key",
            controlType: "INPUT_TEXT",
            hidden: true,
            initialValue: "sessionSignatureKey",
          },
          {
            label: "Session details signature key",
            configProperty: "datasourceConfiguration.properties[1].value",
            controlType: "INPUT_TEXT",
            hidden: {
              path: "datasourceConfiguration.properties[0].value",
              comparison: "EQUALS",
              value: "N",
            },
          },
          {
            label: "Authentication type",
            configProperty:
              "datasourceConfiguration.authentication.authenticationType",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "None",
                value: "dbAuth",
              },
              {
                label: "Basic",
                value: "basic",
              },
              {
                label: "OAuth 2.0",
                value: "oAuth2",
              },
              {
                label: "API key",
                value: "apiKey",
              },
              {
                label: "Bearer token",
                value: "bearerToken",
              },
            ],
          },
          {
            label: "Grant type",
            configProperty: "datasourceConfiguration.authentication.grantType",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: true,
          },
          {
            label: "Access token URL",
            configProperty:
              "datasourceConfiguration.authentication.accessTokenUrl",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Client Id",
            configProperty: "datasourceConfiguration.authentication.clientId",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Client secret",
            configProperty:
              "datasourceConfiguration.authentication.clientSecret",
            dataType: "PASSWORD",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Scope(s)",
            configProperty:
              "datasourceConfiguration.authentication.scopeString",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Header prefix",
            configProperty:
              "datasourceConfiguration.authentication.headerPrefix",
            controlType: "INPUT_TEXT",
            placeholderText: "Bearer (default)",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Add token to",
            configProperty:
              "datasourceConfiguration.authentication.isTokenHeader",
            controlType: "DROP_DOWN",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
            options: [
              {
                label: "Header",
                value: true,
              },
              {
                label: "Query parameters",
                value: false,
              },
            ],
          },
          {
            label: "Audience(s)",
            configProperty: "datasourceConfiguration.authentication.audience",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Resource(s)",
            configProperty: "datasourceConfiguration.authentication.resource",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Send scope with refresh token",
            configProperty:
              "datasourceConfiguration.authentication.sendScopeWithRefreshToken",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: false,
            options: [
              {
                label: "Yes",
                value: true,
              },
              {
                label: "No",
                value: false,
              },
            ],
          },
          {
            label: "Send client credentials with (on refresh token)",
            configProperty:
              "datasourceConfiguration.authentication.refreshTokenClientCredentialsLocation",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: "BODY",
            options: [
              {
                label: "Body",
                value: "BODY",
              },
              {
                label: "Header",
                value: "HEADER",
              },
            ],
          },
        ],
      },
    ],
    "65e58df396506a506bd706be": [
      {
        sectionName: "General",
        children: [
          {
            label: "URL",
            configProperty: "datasourceConfiguration.url",
            controlType: "INPUT_TEXT",
            isRequired: true,
            placeholderText: "https://example.com",
          },
          {
            label: "Headers",
            configProperty: "datasourceConfiguration.headers",
            controlType: "KEYVALUE_ARRAY",
          },
          {
            label: "Query Params",
            configProperty: "datasourceConfiguration.queryParameters",
            controlType: "KEYVALUE_ARRAY",
          },
          {
            label: "Send authentication Information key (do not edit)",
            configProperty: "datasourceConfiguration.properties[0].key",
            controlType: "INPUT_TEXT",
            hidden: true,
            initialValue: "isSendSessionEnabled",
          },
          {
            label: "Send Appsmith signature header",
            subtitle: "Header key: X-APPSMITH-SIGNATURE",
            configProperty: "datasourceConfiguration.properties[0].value",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: "N",
            options: [
              {
                label: "Yes",
                value: "Y",
              },
              {
                label: "No",
                value: "N",
              },
            ],
          },
          {
            label: "Session details signature key key (do not edit)",
            configProperty: "datasourceConfiguration.properties[1].key",
            controlType: "INPUT_TEXT",
            hidden: true,
            initialValue: "sessionSignatureKey",
          },
          {
            label: "Session details signature key",
            configProperty: "datasourceConfiguration.properties[1].value",
            controlType: "INPUT_TEXT",
            hidden: {
              path: "datasourceConfiguration.properties[0].value",
              comparison: "EQUALS",
              value: "N",
            },
          },
        ],
      },
      {
        sectionName: "Authentication",
        children: [
          {
            label: "Authentication type",
            configProperty:
              "datasourceConfiguration.authentication.authenticationType",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "None",
                value: "dbAuth",
              },
              {
                label: "Basic",
                value: "basic",
              },
              {
                label: "OAuth 2.0",
                value: "oAuth2",
              },
              {
                label: "API key",
                value: "apiKey",
              },
              {
                label: "Bearer token",
                value: "bearerToken",
              },
            ],
          },
          {
            label: "Username",
            configProperty: "datasourceConfiguration.authentication.username",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "basic",
            },
          },
          {
            label: "Password",
            configProperty: "datasourceConfiguration.authentication.password",
            dataType: "PASSWORD",
            controlType: "INPUT_TEXT",
            isRequired: false,
            encrypted: true,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "basic",
            },
          },
          {
            label: "Grant type",
            configProperty: "datasourceConfiguration.authentication.grantType",
            controlType: "DROP_DOWN",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
            initialValue: "authorization_code",
            options: [
              {
                label: "Client Credentials",
                value: "client_credentials",
              },
              {
                label: "Authorization Code",
                value: "authorization_code",
              },
            ],
          },
          {
            label: "Add token to",
            configProperty:
              "datasourceConfiguration.authentication.isTokenHeader",
            controlType: "DROP_DOWN",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
            initialValue: true,
            options: [
              {
                label: "Request Header",
                value: true,
              },
              {
                label: "Request URL",
                value: false,
              },
            ],
          },
          {
            label: "Header prefix",
            configProperty:
              "datasourceConfiguration.authentication.headerPrefix",
            controlType: "INPUT_TEXT",
            placeholderText: "eg: Bearer ",
            initialValue: "Bearer",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Access token URL",
            configProperty:
              "datasourceConfiguration.authentication.accessTokenUrl",
            controlType: "INPUT_TEXT",
            placeholderText: "https://example.com/login/oauth/access_token",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Client ID",
            configProperty: "datasourceConfiguration.authentication.clientId",
            controlType: "INPUT_TEXT",
            placeholderText: "Client ID",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Client secret",
            configProperty:
              "datasourceConfiguration.authentication.clientSecret",
            dataType: "PASSWORD",
            placeholderText: "Client secret",
            controlType: "INPUT_TEXT",
            isRequired: false,
            encrypted: true,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Scope(s)",
            configProperty:
              "datasourceConfiguration.authentication.scopeString",
            controlType: "INPUT_TEXT",
            placeholderText: "e.g. read, write",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "oAuth2",
            },
          },
          {
            label: "Authorization URL",
            configProperty:
              "datasourceConfiguration.authentication.authorizationUrl",
            controlType: "INPUT_TEXT",
            placeholderText: "https://example.com/login/oauth/authorize",
            isRequired: false,
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
          },
          {
            label: "Redirect URL",
            subtitle: "Url that the oauth server should redirect to",
            configProperty:
              "datasourceConfiguration.authentication.redirectURL",
            controlType: "FIXED_KEY_INPUT",
            disabled: true,
            placeholderText: "Redirect URL",
            isRequired: false,
            initialValue:
              "{{window.location.origin + '/api/v1/datasources/authorize'}}",
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
          },
          {
            label: "Custom Authentication Parameters",
            configProperty:
              "datasourceConfiguration.authentication.customAuthenticationParameters",
            controlType: "KEYVALUE_ARRAY",
            isRequired: false,
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
          },
          {
            label: "Client Authentication",
            configProperty:
              "datasourceConfiguration.authentication.isAuthorizationHeader",
            controlType: "DROP_DOWN",
            isRequired: false,
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
            initialValue: true,
            options: [
              {
                label: "Send as Basic Auth header",
                value: true,
              },
              {
                label: "Send client credentials in body",
                value: false,
              },
            ],
          },
          {
            label: "Audience(s)",
            configProperty: "datasourceConfiguration.authentication.audience",
            controlType: "INPUT_TEXT",
            placeholderText: "https://example.com/oauth/audience",
            isRequired: false,
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  conditionType: "AND",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "EQUALS",
                      value: "authorization_code",
                    },
                    {
                      path: "datasourceConfiguration.authentication.isAuthorizationHeader",
                      comparison: "EQUALS",
                      value: true,
                    },
                  ],
                },
              ],
            },
          },
          {
            label: "Resource(s)",
            configProperty: "datasourceConfiguration.authentication.resource",
            controlType: "INPUT_TEXT",
            placeholderText: "https://example.com/oauth/resource",
            isRequired: false,
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  conditionType: "AND",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "EQUALS",
                      value: "authorization_code",
                    },
                    {
                      path: "datasourceConfiguration.authentication.isAuthorizationHeader",
                      comparison: "EQUALS",
                      value: true,
                    },
                  ],
                },
              ],
            },
          },
          {
            label: "Send scope with refresh token",
            configProperty:
              "datasourceConfiguration.authentication.sendScopeWithRefreshToken",
            controlType: "DROP_DOWN",
            isRequired: false,
            initialValue: false,
            options: [
              {
                label: "Yes",
                value: true,
              },
              {
                label: "No",
                value: false,
              },
            ],
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
          },
          {
            label: "Send client credentials with (on refresh token)",
            configProperty:
              "datasourceConfiguration.authentication.refreshTokenClientCredentialsLocation",
            controlType: "DROP_DOWN",
            isRequired: false,
            initialValue: "BODY",
            options: [
              {
                label: "Body",
                value: "BODY",
              },
              {
                label: "Header",
                value: "HEADER",
              },
            ],
            hidden: {
              conditionType: "OR",
              conditions: [
                {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                {
                  path: "datasourceConfiguration.authentication.grantType",
                  comparison: "NOT_EQUALS",
                  value: "authorization_code",
                },
              ],
            },
          },
          {
            label: "Key",
            configProperty: "datasourceConfiguration.authentication.label",
            controlType: "INPUT_TEXT",
            placeholderText: "api_key",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "apiKey",
            },
          },
          {
            label: "Value (Encrypted)",
            configProperty: "datasourceConfiguration.authentication.value",
            controlType: "INPUT_TEXT",
            placeholderText: "Value",
            isRequired: false,
            encrypted: true,
            dataType: "PASSWORD",
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "apiKey",
            },
          },
          {
            label: "Add To",
            configProperty: "datasourceConfiguration.authentication.addTo",
            controlType: "DROP_DOWN",
            isRequired: false,
            initialValue: "header",
            options: [
              {
                label: "Query Params",
                value: "queryParams",
              },
              {
                label: "Header",
                value: "header",
              },
            ],
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "apiKey",
            },
          },
          {
            label: "Header prefix",
            configProperty:
              "datasourceConfiguration.authentication.headerPrefix",
            controlType: "INPUT_TEXT",
            placeholderText: "eg: Bearer",
            initialValue: "Bearer",
            isRequired: false,
            hidden: {
              path: "datasourceConfiguration.authentication.addTo",
              comparison: "NOT_EQUALS",
              value: "header",
            },
          },
          {
            label: "Bearer token",
            configProperty:
              "datasourceConfiguration.authentication.bearerToken",
            controlType: "INPUT_TEXT",
            placeholderText: "Bearer token",
            isRequired: false,
            encrypted: true,
            hidden: {
              path: "datasourceConfiguration.authentication.authenticationType",
              comparison: "NOT_EQUALS",
              value: "bearerToken",
            },
          },
        ],
      },
      {
        sectionName: "Advanced Settings *",
        children: [
          {
            label: "Use Self-signed certificate",
            configProperty: "datasourceConfiguration.connection.ssl.authType",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: "DEFAULT",
            options: [
              {
                label: "No",
                value: "DEFAULT",
              },
              {
                label: "Yes",
                value: "SELF_SIGNED_CERTIFICATE",
              },
            ],
          },
          {
            label: "Certificate Details",
            subtitle: "Upload Certificate",
            configProperty:
              "datasourceConfiguration.connection.ssl.certificateFile",
            controlType: "FILE_PICKER",
            isRequired: false,
            encrypted: true,
            hidden: {
              path: "datasourceConfiguration.connection.ssl.authType",
              comparison: "NOT_EQUALS",
              value: "SELF_SIGNED_CERTIFICATE",
            },
          },
        ],
      },
    ],
    "65e58fe2225bee69e71c536a": [
      {
        sectionName: "Details",
        id: 1,
        children: [
          {
            label: "Description",
            configProperty: "datasourceConfiguration.description",
            controlType: "INPUT_TEXT",
            isRequired: false,
            hidden: true,
          },
          {
            label: "Endpoint URL (with or without protocol and port no)",
            configProperty: "datasourceConfiguration.url",
            controlType: "INPUT_TEXT",
            initialValue: "https://ai.appsmith.com",
            isRequired: true,
            hidden: true,
          },
          {
            label: "Files",
            configProperty: "datasourceConfiguration.properties[0].key",
            initialValue: "Files",
            hidden: true,
            controlType: "INPUT_TEXT",
          },
          {
            label: "Files",
            subtitle:
              "Upload files and use them as context for generating text",
            buttonLabel: "Upload Files",
            configProperty: "datasourceConfiguration.properties[0].value",
            controlType: "MULTIPLE_FILE_PICKER",
            labelVisibleWithFiles:
              'To use files, create a new AI query with "Generate text" action and select files under "Use file context" section. Using file context on AI queries will generate accurate responses that are grounded in file contents.',
            allowedFileTypes: [
              "application/pdf",
              "text/plain",
              "text/markdown",
            ],
            maxFileSizeInBytes: 20971520,
            config: {
              uploadToTrigger: true,
              params: {
                requestType: "UPLOAD_FILES",
              },
            },
            isRequired: false,
          },
        ],
      },
    ],
    "65e58df296506a506bd706ad": [],
    "65e58df196506a506bd7069c": [
      {
        sectionName: "Connection",
        id: 1,
        children: [
          {
            label: "Connection mode",
            configProperty: "datasourceConfiguration.connection.mode",
            controlType: "SEGMENTED_CONTROL",
            initialValue: "READ_WRITE",
            options: [
              {
                label: "Read / Write",
                value: "READ_WRITE",
              },
              {
                label: "Read only",
                value: "READ_ONLY",
              },
            ],
          },
          {
            children: [
              {
                label: "Host address",
                configProperty: "datasourceConfiguration.endpoints[*].host",
                controlType: "KEYVALUE_ARRAY",
                validationMessage: "Please enter a valid host",
                validationRegex: "^((?![/:]).)*$",
                placeholderText: "myapp.abcde.postgres.net",
              },
              {
                label: "Port",
                configProperty: "datasourceConfiguration.endpoints[*].port",
                dataType: "NUMBER",
                initialValue: ["5432"],
                controlType: "KEYVALUE_ARRAY",
                placeholderText: "5432",
              },
            ],
          },
          {
            label: "Database name",
            configProperty:
              "datasourceConfiguration.authentication.databaseName",
            controlType: "INPUT_TEXT",
            placeholderText: "Database name",
            initialValue: "admin",
          },
        ],
      },
      {
        sectionName: "Authentication",
        id: 2,
        children: [
          {
            children: [
              {
                label: "Username",
                configProperty:
                  "datasourceConfiguration.authentication.username",
                controlType: "INPUT_TEXT",
                placeholderText: "Username",
              },
              {
                label: "Password",
                configProperty:
                  "datasourceConfiguration.authentication.password",
                dataType: "PASSWORD",
                controlType: "INPUT_TEXT",
                placeholderText: "Password",
                encrypted: true,
              },
            ],
          },
        ],
      },
      {
        id: 3,
        sectionName: "SSL (optional)",
        children: [
          {
            label: "SSL mode",
            configProperty: "datasourceConfiguration.connection.ssl.authType",
            controlType: "DROP_DOWN",
            initialValue: "DEFAULT",
            options: [
              {
                label: "Default",
                value: "DEFAULT",
              },
              {
                label: "Allow",
                value: "ALLOW",
              },
              {
                label: "Prefer",
                value: "PREFER",
              },
              {
                label: "Require",
                value: "REQUIRE",
              },
              {
                label: "Disable",
                value: "DISABLE",
              },
            ],
          },
        ],
      },
    ],
  },
  editorConfigs: {
    "65e58df196506a506bd7069d": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Path",
            configProperty: "actionConfiguration.path",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
          },
          {
            label: "Body",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "Body",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "TEMPLATE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: true,
            },
          },
          {
            label: "Query parameters",
            configProperty: "actionConfiguration.queryParameters",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Headers",
            configProperty: "actionConfiguration.headers",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Form data",
            configProperty: "actionConfiguration.bodyFormData",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Query variables",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[1].value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "Query variables",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[1].value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "TEMPLATE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: true,
            },
          },
          {
            label: "Pagination",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[2].value",
            controlType: "E_GRAPHQL_PAGINATION",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
          },
        ],
      },
    ],
    "65e58df396506a506bd706be": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Path",
            configProperty: "actionConfiguration.path",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
          },
          {
            label: "Body",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "Body",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "TEMPLATE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: true,
            },
          },
          {
            label: "Query parameters",
            configProperty: "actionConfiguration.queryParameters",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Headers",
            configProperty: "actionConfiguration.headers",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Form data",
            configProperty: "actionConfiguration.bodyFormData",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Value",
              },
            ],
          },
          {
            label: "Query variables",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[1].value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "Query variables",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[1].value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "TEMPLATE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: true,
            },
          },
          {
            label: "Pagination",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[2].value",
            controlType: "E_GRAPHQL_PAGINATION",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
          },
        ],
      },
    ],
    "65e58fe2225bee69e71c536a": [
      {
        controlType: "SECTION",
        identifier: "SELECTOR",
        children: [
          {
            label: "Action",
            description: "Choose the action you would like to use",
            configProperty: "actionConfiguration.formData.usecase.data",
            controlType: "DROP_DOWN",
            isRequired: true,
            initialValue: "TEXT_GENERATE",
            options: [
              {
                label: "Generate text",
                value: "TEXT_GENERATE",
              },
              {
                label: "Classify text",
                value: "TEXT_CLASSIFY",
              },
              {
                label: "Summarise text",
                value: "TEXT_SUMMARY",
              },
              {
                label: "Extract entities from text",
                value: "TEXT_ENTITY_EXTRACT",
              },
              {
                label: "Classify Image",
                value: "IMAGE_CLASSIFY",
              },
              {
                label: "Describe Image",
                value: "IMAGE_CAPTION",
              },
              {
                label: "Extract entities from image",
                value: "IMAGE_ENTITY_EXTRACT",
              },
            ],
          },
        ],
      },
      {
        controlType: "SECTION",
        _comment: "This section holds all the templates",
        children: [
          {
            identifier: "TEXT_GENERATE",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'TEXT_GENERATE'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Email Response",
                    value: {
                      "actionConfiguration.formData.textGeneration.input.data":
                        "Write an 100 word apologetic email response to a delay in order shipment due to operational reasons and assure them that the order will be delivered today",
                    },
                  },
                  {
                    label: "Product description",
                    value: {
                      "actionConfiguration.formData.textGeneration.input.data":
                        "Write a creative product description for an electric car named RevaX, with the keywords- fast charging, 200 miles per single charge, compact, eco-friendly, economical. This is targeted towards a climate concious tech/EV enthusiast who enjoys driving. Also describe the benefits of this product in less than 80 words",
                    },
                  },
                  {
                    label: "Candidate response",
                    value: {
                      "actionConfiguration.formData.textGeneration.input.data":
                        "Write a personalised email rejecting Bob’s application for the Software Engineering position at Acme corp due to gaps in technical skills. Make sure the email has a polite tone but contains less than 150 words.",
                    },
                  },
                ],
              },
              {
                label: "Prompt",
                Description: "Provide an prompt for AI to generate text",
                subtitle: "Provide an prompt for AI to generate text",
                configProperty:
                  "actionConfiguration.formData.textGeneration.input.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                initialValue: "",
                isRequired: true,
              },
              {
                label: "Use context from files",
                tooltipText:
                  "Enhance the AI response by providing custom context. Using this option will generate accurate responses that are grounded in file contents.",
                subtitle:
                  "Select files for enhanced AI responses based on file contents. Upload files on the datasource (Data > your Appsmith AI Datasource > Edit > Upload files)",
                isRequired: false,
                propertyName: "fileIds",
                configProperty: "actionConfiguration.formData.fileIds.data",
                controlType: "DROP_DOWN",
                initialValue: [],
                options: [],
                isMultiSelect: true,
                placeholderText: "Select files",
                fetchOptionsConditionally: true,
                conditionals: {
                  enable: "{{true}}",
                  fetchDynamicValues: {
                    condition:
                      "{{actionConfiguration.formData.usecase.data === 'TEXT_GENERATE'}}",
                    config: {
                      params: {
                        requestType: "LIST_FILES",
                        displayType: "DROP_DOWN",
                      },
                    },
                  },
                },
              },
            ],
          },
          {
            identifier: "TEXT_CLASSIFY",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'TEXT_CLASSIFY'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Customer support",
                    value: {
                      "actionConfiguration.formData.textClassify.input.data":
                        '["Hello, I recently made a purchase on your platform, but I encountered an issue during the payment process. The transaction didnt go through, and Im unsure of the cause. Could you please assist? Best, Alice",\n“Hi Alice, We apologize for any inconvenience. To assist you better, could you provide us with the error message you received, if any? Also, please check if your payment method is valid. Thanks, Support Team",\n"I didnt receive any specific error message; the transaction just failed. My payment method should be working fine as I used it elsewhere without any problems. Regards, Alice",\n"Thank you for the information, Alice. We will look into this matter and update you as soon as we have more information. In the meantime, could you try a different payment method? Best, Support Team"]',
                      "actionConfiguration.formData.textClassify.instructions.data":
                        "If no label fits the input, apply “General” label",
                      "actionConfiguration.formData.textClassify.labels.data":
                        "Technical, Urgent, Billing, Account, Upgrade, Bug, Refund",
                    },
                  },
                  {
                    label: "Product review",
                    value: {
                      "actionConfiguration.formData.textClassify.input.data":
                        "Received my laptop stand from Macazon after a significant delay in delivery, which was a bit disappointing. Upon unboxing, I noticed the build seemed sturdy, but unfortunately, the stand doesn't function as expected. It's supposed to be adjustable, but the mechanism is quite stiff, making it challenging to change angles or heights.",
                      "actionConfiguration.formData.textClassify.instructions.data":
                        "Strictly apply only one label",
                      "actionConfiguration.formData.textClassify.labels.data":
                        "Positive, Neutral, Negative",
                    },
                  },
                  {
                    label: "GitHub Issue",
                    value: {
                      "actionConfiguration.formData.textClassify.input.data":
                        "When console statement is long then the text is truncated when printed on the debugger as seen in the screenshot\n\nSteps To Reproduce\nAdd following statement to the editor and execute the function to observe truncation\nconsole.log('This is a long statement to display truncation issue present on the debugger. You can see this statement not being printed in whole')",
                      "actionConfiguration.formData.textClassify.instructions.data":
                        "",
                      "actionConfiguration.formData.textClassify.labels.data":
                        "Bug, Feature Request, Enhancement",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description: "Provide some text for AI to classify",
                subtitle: "Provide some text for AI to classify",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                configProperty:
                  "actionConfiguration.formData.textClassify.input.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                isRequired: true,
              },
              {
                label: "Labels",
                Description:
                  "Provide a comma separated list of labels to classify the Input on",
                subtitle:
                  "Provide a comma separated list of labels to classify the Input on",
                configProperty:
                  "actionConfiguration.formData.textClassify.labels.data",
                placeholderText:
                  "Write a list of comma separated text values or use {{ }} to reference a dynamic value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                customStyles: {
                  width: "872px",
                },
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions for the AI to tweak the text classification",
                subtitle:
                  "Provide additional instructions for the AI to tweak the text classification",
                configProperty:
                  "actionConfiguration.formData.textClassify.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                initialValue: "",
                isRequired: false,
              },
            ],
          },
          {
            identifier: "TEXT_SUMMARY",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'TEXT_SUMMARY'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Support conversation",
                    value: {
                      "actionConfiguration.formData.textSummary.input.data":
                        '["Hey team, I am experiencing difficulties with logging into my account. Despite entering the correct credentials, I keep getting an error message. This issue is preventing me from accessing your services, and I would appreciate a prompt resolution. Regards, Bob", \n"Hello Bob, Thank you for reaching out. We apologize for the inconvenience. Can you please confirm if you have tried resetting your password? Additionally, please ensure that your browser is up-to-date. Best, Support Team",\n"Hi, I tried resetting my password, but the issue persists. Also, my browser is updated to the latest version. Can you please look into this further? Thanks, Bob",\n"Thank you for the update, Bob. We will investigate this further and get back to you shortly. In the meantime, can you try accessing your account from a different device? Regards, Support Team"]',
                      "actionConfiguration.formData.textSummary.instructions.data":
                        "The input is a customer support conversation and contains an array of messages between the customer and the support agent. Summarise the conversation in less than 200 words.",
                    },
                  },
                  {
                    label: "Blog post",
                    value: {
                      "actionConfiguration.formData.textSummary.input.data":
                        "The iPhone 15, Apple's latest entry in its iconic smartphone series, is a testament to the company's continued innovation and commitment to user experience. This review delves into its design, performance, camera, battery life, and unique features, offering a comprehensive overview for both tech enthusiasts and the average consumer. The iPhone 15 sports a sleek design that follows Apple's philosophy of elegance and simplicity. The chassis, a harmonious blend of glass and stainless steel, feels robust yet luxurious. It’s slightly lighter than its predecessor, making it more comfortable to hold for extended periods. The standout design element is the bezel-less OLED display, which offers an immersive viewing experience. The IP68 rating ensures durability against dust and water, making it a reliable companion for everyday use. The Super Retina XDR display on the iPhone 15 is a visual feast. The colors are vibrant, and the blacks are deep, thanks to the OLED technology. With a 120Hz refresh rate, the responsiveness is fluid, whether scrolling through web pages or playing high-intensity games. The brightness levels are impressive, offering excellent visibility even in direct sunlight.\nAudio quality has also seen an upgrade. The speakers deliver richer and more detailed sound, enhancing the overall multimedia experience. Whether it's watching movies or playing games, the audio is immersive and well-balanced. At the heart of the iPhone 15 is Apple's new A17 Bionic chip, which sets a new benchmark in smartphone performance. Coupled with improved machine learning capabilities and a more efficient GPU, it handles everything from everyday tasks to demanding applications with ease. The iOS integration is seamless, providing a user-friendly and intuitive interface. The camera system on the iPhone 15 is where Apple has made significant strides. The new sensor-shift optical image stabilization is a game-changer, particularly in low-light conditions. The images are sharp, with excellent dynamic range and color accuracy. The Night mode is more refined, capturing stunning details in dark environments.\nThe video capabilities are equally impressive. The Cinematic mode, which allows for depth-of-field adjustments, brings a professional touch to video recordings. The ProRAW and ProRes formats cater to professional photographers and videographers who demand higher control and quality. Battery life has always been a strong suit for iPhones, and the iPhone 15 continues this tradition. Even with heavy usage, the phone comfortably lasts a full day, thanks to the efficiency of the A17 chip and the larger battery. The fast charging and MagSafe wireless charging are convenient, though the absence of a charging brick in the box may be a point of contention for some users.The iPhone 15 introduces some noteworthy features. The integration of satellite connectivity for emergency services is a significant safety addition. The improved Face ID works flawlessly, even with masks, making it more practical in current times. The iPhone 15 is a remarkable smartphone that balances innovation with user experience. While it follows the evolutionary path rather than a revolutionary leap, the refinements in camera technology, performance, and unique features like satellite connectivity make it a compelling choice for anyone looking to upgrade. The higher price point might be a hurdle, but for those invested in the Apple ecosystem, the iPhone 15 offers a seamless and premium experience that's hard to match.",
                      "actionConfiguration.formData.textSummary.instructions.data":
                        "Summarise the phone review in less than 250 words and highlight the key features.",
                    },
                  },
                  {
                    label: "Inspection report",
                    value: {
                      "actionConfiguration.formData.textSummary.input.data":
                        "So, this Honda Civic here is 5 years old, got an automatic transmission, and a 1.2L engine. She's been on the road for about 50,000 km. Overall, she's doing okay, but there are a few things that need some attention. The brake pads are pretty much worn out. It's important to get these changed soon for safety, especially when you need to stop quickly or in wet conditions. Next, let's talk tires. The tread on these is getting pretty low, almost hitting the legal limit. Definitely need new ones for a better grip on the road, you don't want to be slipping around, especially when it's raining. Now, the battery is showing its age, not holding charge like it used to. Wouldn't be surprised if one day it just doesn't start the car. Better to swap it out now than be stuck later. The suspension bushings, too, are worn. Changing them will definitely improve the ride, make it smoother. The rest of the car – the engine, transmission, and the interior – they're all in pretty good shape. Just the usual signs of use, nothing major. If you keep up with regular maintenance and take care of these issues I've mentioned, she's going to keep running smoothly for a good long time. Regular check-ups, fixing these bits, and she'll be good as new.",
                      "actionConfiguration.formData.textSummary.instructions.data":
                        "Summarise the inspection report in less than 100 words and highlight the most important points to be noted",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description: "Provide some text for AI to summarise",
                subtitle: "Provide some text for AI to summarise",
                configProperty:
                  "actionConfiguration.formData.textSummary.input.data",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                controlType: "QUERY_DYNAMIC_TEXT",
                isRequired: true,
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions for the AI to tweak the summarization",
                subtitle:
                  "Provide additional instructions for the AI to tweak the summarization",
                configProperty:
                  "actionConfiguration.formData.textSummary.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                initialValue: "",
                isRequired: false,
              },
            ],
          },
          {
            identifier: "TEXT_ENTITY_EXTRACT",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'TEXT_ENTITY_EXTRACT'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Customer support",
                    value: {
                      "actionConfiguration.formData.textEntity.input.data":
                        "Dear team,\n\nI have a query regarding the address update process in my profile. I recently moved to a new location, and I need to update my address to 1234 Oak Street, Newville, NV 12345. However, I am encountering an error on the website. Could you assist me with this? My account number is 99892.\n\nRegards, \nMark ",
                      "actionConfiguration.formData.textEntity.instructions.data":
                        'If you’re unable to extract an entity, respond with "Not found"',
                      "actionConfiguration.formData.textEntity.labels.data":
                        "name, address, account number, gender",
                    },
                  },
                  {
                    label: "Inspection report",
                    value: {
                      "actionConfiguration.formData.textEntity.input.data":
                        "The 2018 Toyota Camry with a mileage of 45,000 miles, VIN 1HGBH41JXMN109186, was thoroughly inspected on January 9, 2024. The engine and transmission are in good condition, showing no significant issues and well-maintained fluid levels. The brakes, however, require attention with the front brake pads and rear brake discs needing replacement due to wear and warping. The suspension system also needs attention; both front struts and rear shock absorbers show signs of leakage and wear and are recommended for replacement. Tire inspection revealed uneven wear patterns with the front left and rear right tires nearing the legal limit for tread depth, necessitating replacement. The exhaust system is in good condition with no observable leaks or corrosion. The electrical system needs attention, particularly the battery, which shows reduced capacity and needs replacement. Cooling system checks out well with adequate coolant levels and no leaks. Some lights and indicators, including the right headlight bulb and rear left turn indicator, are non-functional or dimming and need replacing. The windshield wipers are ineffective and require replacement. Interior components and the body and frame are in good condition, showing only minor wear and superficial damage. In conclusion, while the 2018 Toyota Camry is generally in good condition, it requires maintenance, particularly for the braking system, suspension, tires, electrical systems, lights, and windshield wipers. Addressing these issues will ensure the vehicle’s safety and performance. Regular check-ups are advised to monitor the condition of parts currently in good or fair condition. This inspection was conducted by John Doe, an ASE Certified Mechanic, at XYZ Auto Service Center.",
                      "actionConfiguration.formData.textEntity.instructions.data":
                        "Remove special characters in the VIN and extract the date in MM/DD/YYYY format.",
                      "actionConfiguration.formData.textEntity.labels.data":
                        "year, make, model, VIN, date, mechanic name, service centre name, overall condition",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description:
                  "Provide some text for AI to extract entities from",
                subtitle: "Provide some text for AI to extract entities from",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                configProperty:
                  "actionConfiguration.formData.textEntity.input.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                isRequired: true,
              },
              {
                label: "Entities",
                Description:
                  "Provide a comma separated list of entities to extract from the Input",
                subtitle:
                  "Provide a comma separated list of entities to extract from the Input",
                placeholderText:
                  "Write a list of comma separated text values or use {{ }} to reference a dynamic value",
                configProperty:
                  "actionConfiguration.formData.textEntity.labels.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                customStyles: {
                  width: "872px",
                },
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions for the AI to tweak the entity extraction",
                subtitle:
                  "Provide additional instructions for the AI to tweak the entity extraction",
                configProperty:
                  "actionConfiguration.formData.textEntity.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                initialValue: "",
                isRequired: false,
              },
            ],
          },
          {
            identifier: "IMAGE_CLASSIFY",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'IMAGE_CLASSIFY'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Product category",
                    value: {
                      "actionConfiguration.formData.imageClassify.input.data":
                        "https://i.imgur.com/Eiq5s0F.png",
                      "actionConfiguration.formData.imageClassify.instructions.data":
                        "Identify the category of clothing. Apply only one category.",
                      "actionConfiguration.formData.imageClassify.labels.data":
                        "Jacket, Shirt, Pant, T-Shirt, Shorts, Dress, Skirt",
                    },
                  },
                  {
                    label: "IT Asset Tagging",
                    value: {
                      "actionConfiguration.formData.imageClassify.input.data":
                        "https://i.imgur.com/EqfqRQY.png",
                      "actionConfiguration.formData.imageClassify.instructions.data":
                        "Tag the IT hardware.",
                      "actionConfiguration.formData.imageClassify.labels.data":
                        "Laptop, Phone, Headphones, Mouse, Keyboard, Monitor",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description:
                  "Provide an image URL or the base64 encoded image for AI to extract entities from",
                subtitle:
                  "Provide an image URL or the base64 encoded image for AI to extract entities from",
                configProperty:
                  "actionConfiguration.formData.imageClassify.input.data",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                customStyles: {
                  width: "700px",
                },
              },
              {
                label: "Labels",
                Description:
                  "Provide labels as comma-separated string input for classification",
                subtitle:
                  "Provide a comma separated list of labels to classify the Input on",
                configProperty:
                  "actionConfiguration.formData.imageClassify.labels.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText:
                  "Write a list of comma separated text values or use {{ }} to reference a dynamic value",
                isRequired: true,
                customStyles: {
                  width: "700px",
                },
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions to tweak the classification",
                subtitle:
                  "Provide additional instructions to tweak the classification",
                configProperty:
                  "actionConfiguration.formData.imageClassify.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                isRequired: false,
                initialValue: "",
                customStyles: {
                  width: "700px",
                },
              },
            ],
          },
          {
            identifier: "IMAGE_CAPTION",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'IMAGE_CAPTION'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "Product description",
                    value: {
                      "actionConfiguration.formData.imageCaption.input.data":
                        "https://i.imgur.com/Eiq5s0F.png",
                      "actionConfiguration.formData.imageCaption.instructions.data":
                        "Write a 200 word product description",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description: "Provide an image URL or the base64 encoded image",
                subtitle: "Provide an image URL or the base64 encoded image",
                configProperty:
                  "actionConfiguration.formData.imageCaption.input.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                isRequired: true,
                customStyles: {
                  width: "700px",
                },
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions to tweak the caption",
                subtitle:
                  "Provide additional instructions to tweak the caption",
                configProperty:
                  "actionConfiguration.formData.imageCaption.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                isRequired: false,
                initialValue: "",
                customStyles: {
                  width: "700px",
                },
              },
            ],
          },
          {
            identifier: "IMAGE_ENTITY_EXTRACT",
            controlType: "SECTION",
            conditionals: {
              show: "{{actionConfiguration.formData.usecase.data === 'IMAGE_ENTITY_EXTRACT'}}",
            },
            children: [
              {
                label: "Try out these examples",
                Description: "Try out these examples",
                subtitle: "",
                configProperty: "",
                controlType: "FORM_TEMPLATE",
                isRequired: false,
                options: [
                  {
                    label: "KYC document",
                    value: {
                      "actionConfiguration.formData.imageEntity.input.data":
                        "https://i.imgur.com/5h9SfGf.jpgg",
                      "actionConfiguration.formData.imageEntity.labels.data":
                        "name, date of birth, gender, licence number, height",
                      "actionConfiguration.formData.imageEntity.instructions.data":
                        "",
                    },
                  },
                  {
                    label: "Expense report",
                    value: {
                      "actionConfiguration.formData.imageEntity.input.data":
                        "https://i.imgur.com/z2PlaKB.jpg",
                      "actionConfiguration.formData.imageEntity.labels.data":
                        "food items, tax, total cost, date of purchase",
                      "actionConfiguration.formData.imageEntity.instructions.data":
                        "The date should be in dd/mm/yyyy format",
                    },
                  },
                ],
              },
              {
                label: "Input",
                Description: "Provide an image URL or the base64 encoded image",
                subtitle: "Provide an image URL or the base64 encoded image",
                configProperty:
                  "actionConfiguration.formData.imageEntity.input.data",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                isRequired: true,
                customStyles: {
                  width: "700px",
                },
              },
              {
                label: "Entities",
                Description:
                  "Provide a comma separated list of entities to extract from the Input",
                subtitle:
                  "Provide a comma separated list of entities to extract from the Input",
                configProperty:
                  "actionConfiguration.formData.imageEntity.labels.data",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText:
                  "Write a list of comma separated text values or use {{ }} to reference a dynamic value",
                isRequired: true,
                customStyles: {
                  width: "700px",
                },
              },
              {
                label: "Additional Instructions",
                Description:
                  "Provide additional instructions for the AI to tweak the entity extraction",
                subtitle:
                  "Provide additional instructions for the AI to tweak the entity extraction",
                configProperty:
                  "actionConfiguration.formData.imageEntity.instructions.data",
                controlType: "QUERY_DYNAMIC_TEXT",
                placeholderText:
                  "Write some text or use {{ }} to reference a dynamic text value",
                initialValue: "",
                isRequired: false,
              },
            ],
          },
        ],
      },
    ],
    "65e58df296506a506bd706ad": [],
    "65e58df196506a506bd7069c": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "",
            internalLabel: "Query",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_TEXT",
            evaluationSubstitutionType: "PARAMETER",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "",
            internalLabel: "Query",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_TEXT",
            evaluationSubstitutionType: "TEMPLATE",
            hidden: {
              path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
              comparison: "EQUALS",
              value: true,
            },
          },
          {
            label: "Use prepared statements",
            tooltipText:
              "Prepared statements prevent SQL injections on your queries but do not support dynamic bindings outside values in your SQL",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[0].value",
            controlType: "SWITCH",
            initialValue: true,
          },
        ],
      },
    ],
  },
  settingConfigs: {
    "65e58df196506a506bd7069d": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Run behavior",
            configProperty: "runBehavior",
            controlType: "DROP_DOWN",
            initialValue: "MANUAL",
            options: [
              {
                label: "On page load",
                subText:
                  "Query runs when the page loads or when manually triggered",
                value: "ON_PAGE_LOAD",
              },
              {
                label: "Manual",
                subText:
                  "Query only runs when called in an event or JS with .run()",
                value: "MANUAL",
              },
            ],
          },
          {
            label: "Request confirmation before running this API",
            configProperty: "confirmBeforeExecute",
            controlType: "SWITCH",
            tooltipText:
              "Ask confirmation from the user each time before refreshing data",
          },
          {
            label: "Encode query params",
            configProperty: "actionConfiguration.encodeParamsToggle",
            controlType: "SWITCH",
            tooltipText:
              "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
          },
          {
            label: "Smart JSON substitution",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[0].value",
            controlType: "SWITCH",
            tooltipText:
              "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
            initialValue: true,
          },
          {
            label: "Protocol",
            configProperty: "actionConfiguration.httpVersion",
            name: "actionConfiguration.httpVersion",
            controlType: "DROP_DOWN",
            initialValue: "HTTP/1.1",
            options: [
              {
                label: "HTTP/1.1",
                value: "HTTP11",
              },
              {
                label: "HTTP/2",
                value: "H2",
              },
              {
                label: "H2C",
                value: "H2C",
              },
            ],
            placeholder: "Select HTTP Protocol",
          },
          {
            label: "API timeout (in milliseconds)",
            subtitle: "Maximum time after which the API will return",
            controlType: "INPUT_TEXT",
            configProperty: "actionConfiguration.timeoutInMillisecond",
            dataType: "NUMBER",
          },
        ],
      },
    ],
    "65e58df396506a506bd706be": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Run behavior",
            configProperty: "runBehavior",
            controlType: "DROP_DOWN",
            initialValue: "MANUAL",
            options: [
              {
                label: "On page load",
                subText:
                  "Query runs when the page loads or when manually triggered",
                value: "ON_PAGE_LOAD",
              },
              {
                label: "Manual",
                subText:
                  "Query only runs when called in an event or JS with .run()",
                value: "MANUAL",
              },
            ],
          },
          {
            label: "Request confirmation before running this API",
            configProperty: "confirmBeforeExecute",
            controlType: "SWITCH",
            tooltipText:
              "Ask confirmation from the user each time before refreshing data",
          },
          {
            label: "Encode query params",
            configProperty: "actionConfiguration.encodeParamsToggle",
            controlType: "SWITCH",
            tooltipText:
              "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
          },
          {
            label: "Smart JSON substitution",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[0].value",
            controlType: "SWITCH",
            tooltipText:
              "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
            initialValue: true,
          },
          {
            label: "Protocol",
            configProperty: "actionConfiguration.httpVersion",
            name: "actionConfiguration.httpVersion",
            controlType: "DROP_DOWN",
            initialValue: "HTTP/1.1",
            options: [
              {
                label: "HTTP/1.1",
                value: "HTTP11",
              },
              {
                label: "HTTP/2",
                value: "H2",
              },
              {
                label: "H2C",
                value: "H2C",
              },
            ],
            placeholder: "Select HTTP Protocol",
          },
          {
            label: "API timeout (in milliseconds)",
            subtitle: "Maximum time after which the API will return",
            controlType: "INPUT_TEXT",
            configProperty: "actionConfiguration.timeoutInMillisecond",
            dataType: "NUMBER",
          },
        ],
      },
    ],
    "65e58fe2225bee69e71c536a": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Run behavior",
            configProperty: "runBehavior",
            controlType: "DROP_DOWN",
            initialValue: "MANUAL",
            options: [
              {
                label: "On page load",
                subText:
                  "Query runs when the page loads or when manually triggered",
                value: "ON_PAGE_LOAD",
              },
              {
                label: "Manual",
                subText:
                  "Query only runs when called in an event or JS with .run()",
                value: "MANUAL",
              },
            ],
          },
          {
            label: "Request confirmation before running this query",
            configProperty: "confirmBeforeExecute",
            controlType: "SWITCH",
            tooltipText:
              "Ask confirmation from the user each time before refreshing data",
          },
          {
            label: "Query timeout (in milliseconds)",
            subtitle: "Maximum time after which the query will return",
            configProperty: "actionConfiguration.timeoutInMillisecond",
            controlType: "INPUT_TEXT",
            initialValue: 60000,
            dataType: "NUMBER",
          },
        ],
      },
    ],
    "65e58df296506a506bd706ad": [],
    "65e58df196506a506bd7069c": [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Run behavior",
            configProperty: "runBehavior",
            controlType: "DROP_DOWN",
            initialValue: "MANUAL",
            options: [
              {
                label: "On page load",
                subText:
                  "Query runs when the page loads or when manually triggered",
                value: "ON_PAGE_LOAD",
              },
              {
                label: "Manual",
                subText:
                  "Query only runs when called in an event or JS with .run()",
                value: "MANUAL",
              },
            ],
          },
          {
            label: "Request confirmation before running this query",
            configProperty: "confirmBeforeExecute",
            controlType: "SWITCH",
            tooltipText:
              "Ask confirmation from the user each time before refreshing data",
          },
          {
            label: "Use prepared statements",
            tooltipText:
              "Prepared statements prevent SQL injections on your queries but do not support dynamic bindings outside values in your SQL",
            configProperty:
              "actionConfiguration.pluginSpecifiedTemplates[0].value",
            controlType: "SWITCH",
            initialValue: true,
          },
          {
            label: "Query timeout (in milliseconds)",
            subtitle: "Maximum time after which the query will return",
            configProperty: "actionConfiguration.timeoutInMillisecond",
            controlType: "INPUT_TEXT",
            dataType: "NUMBER",
          },
        ],
      },
    ],
  },
  datasourceFormButtonConfigs: {
    "65e58df196506a506bd7069d": ["CANCEL", "SAVE"],
    "65e58df396506a506bd706be": ["CANCEL", "SAVE"],
    "65e58fe2225bee69e71c536a": ["CANCEL", "SAVE"],
    "65e58df196506a506bd7069c": ["TEST", "CANCEL", "SAVE"],
  },
  dependencies: {
    "65e58df196506a506bd7069d": {
      "actionConfiguration.body": [
        "actionConfiguration.pluginSpecifiedTemplates[0].value",
      ],
    },
    "65e58df396506a506bd706be": {
      "actionConfiguration.body": [
        "actionConfiguration.pluginSpecifiedTemplates[0].value",
      ],
    },
    "65e58fe2225bee69e71c536a": {},
    "65e58df296506a506bd706ad": {},
  },
  fetchingSinglePluginForm: {
    "65e58df196506a506bd7069c": false,
  },
  fetchingDefaultPlugins: false,
} as unknown as PluginDataState;

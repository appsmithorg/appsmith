export const BASE_WORKFLOW_EDITOR_URL = "/workflow";
export const WORKFLOW_EDITOR_URL = `${BASE_WORKFLOW_EDITOR_URL}/:workflowId`;

export const WORKFLOW_QUERY_EDITOR_PATH = `/queries/:queryId`;
export const WORKFLOW_API_EDITOR_PATH = `/api/:apiId`;
export const WORKFLOW_CURL_IMPORT_PATH = `/api/curl/curl-import`;

export const SAAS_BASE_PATH = `/saas`;
export const SAAS_EDITOR_PATH = `${SAAS_BASE_PATH}/:pluginPackageName`;
export const SAAS_EDITOR_API_ID_PATH = `${SAAS_EDITOR_PATH}/api/:apiId`;

export const INTEGRATION_EDITOR_PATH = "/datasources/:selectedTab";
export const SAAS_EDITOR_DATASOURCE_ID_PATH =
  "/saas/:pluginPackageName/datasources/:datasourceId";
export const DATA_SOURCES_EDITOR_ID_PATH = `/datasource/:datasourceId`;

// TODO (Workflows): parked till jsobject pageid dissociation is done
export const JS_COLLECTION_EDITOR_PATH = `/jsObjects`;
export const JS_COLLECTION_ID_PATH = `${JS_COLLECTION_EDITOR_PATH}/:collectionId`;

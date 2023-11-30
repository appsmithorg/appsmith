export const BASE_PACKAGE_EDITOR_PATH = "/pkg";
export const PACKAGE_EDITOR_PATH = `${BASE_PACKAGE_EDITOR_PATH}/:packageId`;
export const MODULE_EDITOR_BASE_PATH = `${PACKAGE_EDITOR_PATH}/:moduleId`;
export const MODULE_EDITOR_PATH = `${MODULE_EDITOR_BASE_PATH}/edit`;

export const MODULE_QUERY_EDITOR_PATH = `/queries/:queryId`;
export const MODULE_API_EDITOR_PATH = `/api/:apiId`;
export const MODULE_CURL_IMPORT_PATH = `/api/curl/curl-import`;

export const SAAS_BASE_PATH = `/saas`;
export const SAAS_EDITOR_PATH = `${SAAS_BASE_PATH}/:pluginPackageName`;
export const SAAS_EDITOR_API_ID_PATH = `${SAAS_EDITOR_PATH}/api/:apiId`;

export const INTEGRATION_EDITOR_PATH = "/datasources/:selectedTab";
export const SAAS_EDITOR_DATASOURCE_ID_PATH =
  "/saas/:pluginPackageName/datasources/:datasourceId";
export const DATA_SOURCES_EDITOR_ID_PATH = `/datasource/:datasourceId`;

export const MODULE_JS_COLLECTION_EDITOR_PATH = `/jsObjects/:collectionId`;

export const SAAS_BASE_PATH = `/saas`;
export const SAAS_EDITOR_PATH = `${SAAS_BASE_PATH}/:pluginPackageName`;
export const SAAS_EDITOR_DATASOURCE_ID_PATH = `${SAAS_EDITOR_PATH}/datasources/:datasourceId`;
export const SAAS_EDITOR_API_ID_PATH = `${SAAS_EDITOR_PATH}/api/:baseApiId`;
export const SAAS_EDITOR_API_ID_ADD_PATH = `${SAAS_EDITOR_PATH}/api/:baseApiId/:sidebarState`;

export const APPSMITH_TOKEN_STORAGE_KEY = "APPSMITH_AUTH_TOKEN";

import {
  BUILDER_PAGE_URL,
  BUILDER_URL,
  convertToQueryParams,
  addBranchPath,
} from "constants/routes";

export const SAAS_BASE_PATH = `${BUILDER_URL}/saas`;
export const SAAS_EDITOR_PATH = `${SAAS_BASE_PATH}/:pluginPackageName`;
export const SAAS_EDITOR_DATASOURCE_ID_PATH = `${SAAS_EDITOR_PATH}/datasources/:datasourceId`;
export const SAAS_EDITOR_API_ID_PATH = `${SAAS_EDITOR_PATH}/api/:apiId`;

export const SAAS_BASE_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
) => addBranchPath(`${BUILDER_PAGE_URL(applicationId, pageId)}/saas`);

export const SAAS_EDITOR_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  pluginPackageName = ":pluginPackageName",
): string => {
  return addBranchPath(
    `${SAAS_BASE_URL(applicationId, pageId)}/${pluginPackageName}`,
  );
};

export const SAAS_EDITOR_DATASOURCE_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  pluginPackageName = ":pluginPackageName",
  datasourceId = ":datasourceId",
  params = {},
): string => {
  const queryParams = convertToQueryParams(params);
  return addBranchPath(
    `${SAAS_EDITOR_URL(
      applicationId,
      pageId,
      pluginPackageName,
    )}/datasources/${datasourceId}${queryParams}`,
  );
};

export const SAAS_EDITOR_API_ID_URL = (
  applicationId = ":applicationId",
  pageId = ":pageId",
  pluginPackageName = ":pluginPackageName",
  apiId = ":apiId",
  params = {},
): string => {
  const queryParams = convertToQueryParams(params);
  return addBranchPath(
    `${SAAS_EDITOR_URL(
      applicationId,
      pageId,
      pluginPackageName,
    )}/api/${apiId}${queryParams}`,
  );
};

export const APPSMITH_TOKEN_STORAGE_KEY = "APPSMITH_AUTH_TOKEN";

import { matchPath } from "react-router";
import { matchBasePath } from "pages/Editor/Explorer/helpers";
import {
  API_EDITOR_ID_PATH,
  QUERIES_EDITOR_ID_PATH,
  DATA_SOURCES_EDITOR_ID_PATH,
  JS_COLLECTION_ID_PATH,
  matchBuilderPath,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";

export const getEntityInCurrentPath = (pathName: string) => {
  const builderMatch = matchBuilderPath(pathName);
  if (builderMatch)
    return {
      type: "page",
      id: builderMatch?.params?.pageId,
      params: builderMatch?.params,
    };

  const baseMatch = matchBasePath(pathName);
  if (!baseMatch) return { type: "", id: "" };
  const { path: basePath } = baseMatch;
  const apiMatch = matchPath<{ apiId: string }>(pathName, {
    path: [
      `${basePath}${API_EDITOR_ID_PATH}`,
      `${basePath}${SAAS_EDITOR_API_ID_PATH}`,
    ],
  });
  if (apiMatch)
    return {
      type: "action",
      id: apiMatch?.params?.apiId,
      params: apiMatch?.params,
    };

  const queryMatch = matchPath<{ queryId: string }>(pathName, {
    path: `${basePath}${QUERIES_EDITOR_ID_PATH}`,
  });
  if (queryMatch)
    return {
      type: "action",
      id: queryMatch.params?.queryId,
      params: queryMatch?.params,
    };

  const datasourceMatch = matchPath<{ datasourceId: string }>(pathName, {
    path: `${basePath}${DATA_SOURCES_EDITOR_ID_PATH}`,
  });
  if (datasourceMatch)
    return {
      type: "datasource",
      id: datasourceMatch?.params?.datasourceId,
      params: datasourceMatch?.params,
    };

  const jsObjectMatch = matchPath<{ collectionId: string }>(pathName, {
    path: `${basePath}${JS_COLLECTION_ID_PATH}`,
  });
  if (jsObjectMatch) {
    return {
      type: "jsAction",
      id: jsObjectMatch?.params?.collectionId,
      params: jsObjectMatch?.params,
    };
  }

  return {
    type: "",
    id: "",
  };
};

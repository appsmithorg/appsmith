import { matchPath } from "react-router";
import {
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
} from "constants/routes";
import { PluginType } from "entities/Action";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";

export const getSelectedDatasourceId = (path: string): string | undefined => {
  const entityInfo = identifyEntityFromPath(path);
  if (entityInfo.entity === FocusEntity.DATASOURCE) {
    return entityInfo.id;
  }
};

export type QueryListState =
  | { id: string; type: PluginType; pluginPackageName?: string }
  | undefined;

export const getSelectedQueryId = (path: string): QueryListState => {
  const entityInfo = identifyEntityFromPath(path);
  if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
    const { apiId, pluginPackageName, queryId } = entityInfo.params;
    const id = apiId ? apiId : queryId;
    if (!id) return undefined;
    let type: PluginType = PluginType.API;
    if (pluginPackageName) {
      type = PluginType.SAAS;
    } else if (queryId) {
      type = PluginType.DB;
    } else if (id === "curl") {
      type = PluginType.API;
    }
    return {
      type,
      id,
      pluginPackageName,
    };
  }
};

export const getSelectedJSObjectId = (path: string): string | undefined => {
  const entityInfo = identifyEntityFromPath(path);
  if (entityInfo.entity === FocusEntity.JS_OBJECT) {
    return entityInfo.id;
  }
};

export const getSelectedSegment = (path: string): string | undefined => {
  const match = matchPath<{ entity: string }>(path, {
    path: [
      BUILDER_PATH_DEPRECATED + "/:entity",
      BUILDER_PATH + "/:entity",
      BUILDER_CUSTOM_PATH + "/:entity",
    ],
    exact: false,
  });
  if (!match) return undefined;
  if (match.params.entity === "jsObjects") {
    return EditorEntityTab.JS;
  }
  if (
    match.params.entity === "queries" ||
    match.params.entity === "api" ||
    match.params.entity === "saas"
  ) {
    return EditorEntityTab.QUERIES;
  }
  return EditorEntityTab.UI;
};

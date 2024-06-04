import history, { NavigationMethod } from "utils/history";
import {
  builderURL,
  curlImportPageURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
} from "@appsmith/RouteBuilder";
import { PluginType } from "entities/Action";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { getQueryEntityItemUrl } from "../pages/Editor/IDE/EditorPane/Query/utils";

export function setSelectedDatasource(id?: string) {
  if (id) {
    history.replace(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
      {
        invokedBy: NavigationMethod.ContextSwitching,
      },
    );
  }
}

export function setSelectedQuery(entityInfo?: FocusEntityInfo) {
  if (entityInfo && entityInfo.params.pageId) {
    if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
      const { apiId, pluginPackageName, queryId } = entityInfo.params;
      const key = apiId ? apiId : queryId;
      if (!key) return undefined;
      let type: PluginType = PluginType.API;
      if (pluginPackageName) {
        type = PluginType.SAAS;
      } else if (queryId) {
        type = PluginType.DB;
      } else if (key === "curl") {
        history.replace(curlImportPageURL({}), {
          invokedBy: NavigationMethod.ContextSwitching,
        });
      }

      const url = getQueryEntityItemUrl(
        { type, key, title: key },
        entityInfo.params.pageId,
      );
      history.replace(url, { invokedBy: NavigationMethod.ContextSwitching });
    }
  }
}

export function setSelectedJSObject(focusInfo?: FocusEntityInfo) {
  if (focusInfo && focusInfo.entity === FocusEntity.JS_OBJECT) {
    history.replace(
      jsCollectionIdURL({
        collectionId: focusInfo.id,
      }),
      { invokedBy: NavigationMethod.ContextSwitching },
    );
  }
}

export function setSelectedEntityUrl(url?: string) {
  if (url) {
    history.replace(builderURL({ suffix: url }), {
      invokedBy: NavigationMethod.ContextSwitching,
    });
  }
}

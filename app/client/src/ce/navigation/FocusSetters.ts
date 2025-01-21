import history, { NavigationMethod } from "utils/history";
import {
  builderURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
} from "ee/RouteBuilder";
import { PluginType } from "entities/Plugin";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { getQueryEntityItemUrl } from "ee/pages/Editor/IDE/EditorPane/Query/utils/getQueryEntityItemUrl";

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
  if (entityInfo && entityInfo.params.basePageId) {
    if ([FocusEntity.API, FocusEntity.QUERY].includes(entityInfo.entity)) {
      const { baseApiId, baseQueryId, pluginPackageName } = entityInfo.params;
      const key = baseApiId ? baseApiId : baseQueryId;

      if (!key) return undefined;

      let type: PluginType = PluginType.API;

      if (pluginPackageName) {
        type = PluginType.SAAS;
      } else if (baseQueryId) {
        type = PluginType.DB;
      }

      const url = getQueryEntityItemUrl(
        { type, key, title: key },
        entityInfo.params.basePageId,
      );

      history.replace(url, { invokedBy: NavigationMethod.ContextSwitching });
    }
  }
}

export function setSelectedJSObject(focusInfo?: FocusEntityInfo) {
  if (focusInfo && focusInfo.entity === FocusEntity.JS_OBJECT) {
    history.replace(
      jsCollectionIdURL({
        baseCollectionId: focusInfo.id,
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

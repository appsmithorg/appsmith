import history from "utils/history";
import {
  apiEditorIdURL,
  curlImportPageURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "@appsmith/RouteBuilder";
import { PluginType } from "../entities/Action";
import type { QueryListState } from "./FocusSelectors";

export function setSelectedDatasource(id: string | undefined) {
  if (id) {
    history.replace(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
    );
  }
}

export function setPageUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.replace(`${path}${params}`);
  }
}

export function setAppUrl(path: string | undefined) {
  if (path) {
    const params = history.location.search;
    history.replace(`${path}${params}`);
  }
}

export function setSelectedQuery(state: QueryListState) {
  if (state) {
    switch (state.type) {
      case PluginType.SAAS:
        if (state.pluginPackageName) {
          history.replace(
            saasEditorApiIdURL({
              apiId: state.id,
              pluginPackageName: state.pluginPackageName,
            }),
          );
        }
        break;
      case PluginType.DB:
        history.replace(
          queryEditorIdURL({
            queryId: state.id,
          }),
        );
        break;
      case PluginType.API:
        if (state.id === "curl") {
          history.replace(curlImportPageURL({}));
        } else {
          history.replace(
            apiEditorIdURL({
              apiId: state.id,
            }),
          );
        }
        break;
      default:
        break;
    }
  }
}

export function setSelectedJSObject(id: string | undefined) {
  if (id) {
    history.replace(
      jsCollectionIdURL({
        collectionId: id,
      }),
    );
  }
}

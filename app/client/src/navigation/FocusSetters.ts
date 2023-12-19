import history from "utils/history";
import {
  apiEditorIdURL,
  builderURL,
  curlImportPageURL,
  datasourcesEditorIdURL,
  jsCollectionIdURL,
  jsCollectionListURL,
  queryEditorIdURL,
  queryListURL,
  saasEditorApiIdURL,
  widgetListURL,
} from "@appsmith/RouteBuilder";
import { PluginType } from "../entities/Action";
import type { QueryListState } from "./FocusSelectors";
import { EditorEntityTab } from "entities/IDE/constants";

export function setSelectedDatasource(id: string | undefined) {
  if (id) {
    history.replace(
      datasourcesEditorIdURL({
        datasourceId: id,
      }),
    );
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

export function setSelectedSegment(tab?: EditorEntityTab) {
  if (tab) {
    switch (tab) {
      case EditorEntityTab.JS:
        history.replace(jsCollectionListURL({}));
        break;
      case EditorEntityTab.QUERIES:
        history.replace(queryListURL({}));
        break;
      case EditorEntityTab.UI:
        history.replace(widgetListURL({}));
        break;
      default:
        history.replace(builderURL({}));
    }
  }
}

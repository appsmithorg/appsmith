import history, { NavigationMethod } from "utils/history";
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
import { PluginType } from "entities/Action";
import type { QueryListState } from "./FocusSelectors";
import { EditorEntityTab } from "@appsmith/entities/IDE/constants";

export function setSelectedDatasource(id: string | undefined) {
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
            {
              invokedBy: NavigationMethod.ContextSwitching,
            },
          );
        }
        break;
      case PluginType.DB:
        history.replace(
          queryEditorIdURL({
            queryId: state.id,
          }),
          {
            invokedBy: NavigationMethod.ContextSwitching,
          },
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
            {
              invokedBy: NavigationMethod.ContextSwitching,
            },
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
        history.replace(jsCollectionListURL({ persistExistingParams: true }), {
          invokedBy: NavigationMethod.ContextSwitching,
        });
        break;
      case EditorEntityTab.QUERIES:
        history.replace(queryListURL({ persistExistingParams: true }), {
          invokedBy: NavigationMethod.ContextSwitching,
        });
        break;
      case EditorEntityTab.UI:
        history.replace(widgetListURL({ persistExistingParams: true }), {
          invokedBy: NavigationMethod.ContextSwitching,
        });
        break;
      default:
        history.replace(builderURL({ persistExistingParams: true }), {
          invokedBy: NavigationMethod.ContextSwitching,
        });
    }
  }
}

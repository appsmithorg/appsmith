import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import type { Log } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import type { AppState } from "@appsmith/reducers";
import { getWidget } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction, getPlugins } from "selectors/entitiesSelector";
import { onApiEditor, onCanvas, onQueryEditor } from "../helpers";
import { getLastSelectedWidget } from "selectors/ui";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import {
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import history, { NavigationMethod } from "utils/history";
import { jsCollectionIdURL } from "RouteBuilder";
import store from "store";
import { PluginType } from "entities/Action";

export const useFilteredLogs = (query: string, filter?: any) => {
  let logs = useSelector((state: AppState) => state.ui.debugger.logs);

  if (filter) {
    logs = logs.filter(
      (log) => log.severity === filter || log.category === filter,
    );
  }

  if (query) {
    logs = logs.filter((log) => {
      if (
        !!log.source?.name &&
        log.source?.name.toUpperCase().indexOf(query.toUpperCase()) !== -1
      )
        return true;
      if (log.text.toUpperCase().indexOf(query.toUpperCase()) !== -1)
        return true;
      if (
        !!log.state &&
        JSON.stringify(log.state).toUpperCase().indexOf(query.toUpperCase()) !==
          -1
      )
        return true;
    });
  }
  return logs;
};

export const usePagination = (data: Log[], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<Log[]>([]);
  const [maxPage, setMaxPage] = useState(1);

  useEffect(() => {
    const data = currentData();
    setPaginatedData(data);
  }, [currentPage, data.length, data[data.length - 1]?.occurrenceCount]);

  const currentData = useCallback(() => {
    const newMaxPage = Math.ceil(data.length / itemsPerPage);
    setMaxPage(newMaxPage);

    // Show the last itemsPerPage items
    const start = Math.max(data.length - currentPage * itemsPerPage, 0);
    const end = data.length;
    return data.slice(start, end);
  }, [data]);

  const next = useCallback(() => {
    const tempMaxPage = maxPage;
    setCurrentPage((currentPage) => {
      const newCurrentPage = Math.max(
        Math.min(currentPage + 1, tempMaxPage),
        1,
      );
      return newCurrentPage;
    });
  }, []);

  return { next, paginatedData };
};

export const useSelectedEntity = () => {
  const params: any = useParams();
  const action = useSelector((state: AppState) => {
    if (onApiEditor() || onQueryEditor()) {
      const id = params.apiId || params.queryId;

      return getAction(state, id);
    }

    return null;
  });

  const selectedWidget = useSelector(getLastSelectedWidget);
  const widget = useSelector((state: AppState) => {
    if (onCanvas()) {
      return selectedWidget ? getWidget(state, selectedWidget) : null;
    }

    return null;
  });

  if (onApiEditor() || onQueryEditor()) {
    return {
      name: action?.name ?? "",
      type: ENTITY_TYPE.ACTION,
      id: action?.id ?? "",
    };
  } else if (onCanvas()) {
    return {
      name: widget?.widgetName ?? "",
      type: ENTITY_TYPE.WIDGET,
      id: widget?.widgetId ?? "",
    };
  }

  return null;
};

export const useEntityLink = () => {
  const pageId = useSelector(getCurrentPageId);
  const plugins = useSelector(getPlugins);
  const applicationId = useSelector(getCurrentApplicationId);

  const { navigateToWidget } = useNavigateToWidget();

  const navigateToEntity = useCallback(
    (name) => {
      const dataTree = getDataTree(store.getState());
      const configTree = getConfigTree();
      const entity = dataTree[name];
      const entityConfig = configTree[name];
      if (!pageId) return;
      if (isWidget(entity)) {
        navigateToWidget(
          entity.widgetId,
          entity.type,
          pageId || "",
          NavigationMethod.Debugger,
        );
      } else if (isAction(entity)) {
        const actionConfig = getActionConfig(entityConfig.pluginType);
        let plugin;
        if (entityConfig?.pluginType === PluginType.SAAS) {
          plugin = plugins.find(
            (plugin) => plugin?.id === entityConfig?.pluginId,
          );
        }
        const url =
          applicationId &&
          actionConfig?.getURL(
            pageId,
            entity.actionId,
            entityConfig.pluginType,
            plugin,
          );

        if (url) {
          history.push(url);
        }
      } else if (isJSAction(entity)) {
        history.push(
          jsCollectionIdURL({
            pageId,
            collectionId: entity.actionId,
          }),
        );
      }
    },
    [pageId],
  );

  return {
    navigateToEntity,
  };
};

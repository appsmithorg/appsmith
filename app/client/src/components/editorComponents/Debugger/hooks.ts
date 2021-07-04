import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { ENTITY_TYPE, Message } from "entities/AppsmithConsole";
import { AppState } from "reducers";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import { getWidget } from "sagas/selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction } from "selectors/entitiesSelector";
import {
  getCurrentWidgetId,
  getIsPropertyPaneVisible,
} from "selectors/propertyPaneSelectors";
import { isWidget, isAction } from "workers/evaluationUtils";
import { onApiEditor, onQueryEditor, onCanvas } from "./helpers";
import history from "utils/history";

export const useFilteredLogs = (query: string, filter?: any) => {
  let logs = useSelector((state: AppState) => state.ui.debugger.logs);

  if (filter) {
    logs = logs.filter((log: Message) => log.severity === filter);
  }

  if (query) {
    logs = logs.filter((log: Message) => {
      if (log.source?.name)
        return (
          log.source?.name.toUpperCase().indexOf(query.toUpperCase()) !== -1
        );
    });
  }

  return logs;
};

export const usePagination = (data: Message[], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<Message[]>([]);
  const maxPage = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    const data = currentData();
    setPaginatedData(data);
  }, [currentPage, data.length]);

  const currentData = useCallback(() => {
    const end = currentPage * itemsPerPage;
    return data.slice(0, end);
  }, [data]);

  const next = useCallback(() => {
    setCurrentPage((currentPage) => {
      const newCurrentPage = Math.min(currentPage + 1, maxPage);
      return newCurrentPage <= 0 ? 1 : newCurrentPage;
    });
  }, []);

  return { next, paginatedData };
};

export const useSelectedEntity = () => {
  const applicationId = useSelector(getCurrentApplicationId);
  const currentPageId = useSelector(getCurrentPageId);

  const params: any = useParams();
  const action = useSelector((state: AppState) => {
    if (
      onApiEditor(applicationId, currentPageId) ||
      onQueryEditor(applicationId, currentPageId)
    ) {
      const id = params.apiId || params.queryId;

      return getAction(state, id);
    }

    return null;
  });

  const isPropertyPaneVisible = useSelector(getIsPropertyPaneVisible);
  const selectedWidget = useSelector(getCurrentWidgetId);
  const widget = useSelector((state: AppState) => {
    if (onCanvas(applicationId, currentPageId) && isPropertyPaneVisible) {
      return selectedWidget ? getWidget(state, selectedWidget) : null;
    }

    return null;
  });

  if (
    onApiEditor(applicationId, currentPageId) ||
    onQueryEditor(applicationId, currentPageId)
  ) {
    return {
      name: action?.name ?? "",
      type: ENTITY_TYPE.ACTION,
      id: action?.id ?? "",
    };
  } else if (onCanvas(applicationId, currentPageId)) {
    return {
      name: widget?.widgetName ?? "",
      type: ENTITY_TYPE.WIDGET,
      id: widget?.widgetId ?? "",
    };
  }

  return null;
};

export const useEntityLink = () => {
  const dataTree = useSelector(getDataTree);
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);

  const { navigateToWidget } = useNavigateToWidget();

  const navigateToEntity = useCallback(
    (name) => {
      const entity = dataTree[name];
      if (isWidget(entity)) {
        navigateToWidget(entity.widgetId, entity.type, pageId || "");
      } else if (isAction(entity)) {
        const actionConfig = getActionConfig(entity.pluginType);
        const url =
          applicationId &&
          actionConfig?.getURL(applicationId, pageId || "", entity.actionId);

        if (url) {
          history.push(url);
        }
      }
    },
    [dataTree],
  );

  return {
    navigateToEntity,
  };
};

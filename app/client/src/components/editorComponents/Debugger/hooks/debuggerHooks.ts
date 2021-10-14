import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { ENTITY_TYPE, Log } from "entities/AppsmithConsole";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction } from "selectors/entitiesSelector";
import { onApiEditor, onQueryEditor, onCanvas } from "../helpers";
import { getSelectedWidget } from "selectors/ui";
import { getDataTree } from "selectors/dataTreeSelectors";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { isWidget, isAction, isJSAction } from "workers/evaluationUtils";
import history from "utils/history";
import { JS_COLLECTION_ID_URL } from "constants/routes";

export const useFilteredLogs = (query: string, filter?: any) => {
  let logs = useSelector((state: AppState) => state.ui.debugger.logs);

  if (filter) {
    logs = logs.filter((log) => log.severity === filter);
  }

  if (query) {
    logs = logs.filter((log) => {
      if (log.source?.name)
        return (
          log.source?.name.toUpperCase().indexOf(query.toUpperCase()) !== -1
        );
    });
  }

  return logs;
};

export const usePagination = (data: Log[], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<Log[]>([]);
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
  const params: any = useParams();
  const action = useSelector((state: AppState) => {
    if (onApiEditor() || onQueryEditor()) {
      const id = params.apiId || params.queryId;

      return getAction(state, id);
    }

    return null;
  });

  const selectedWidget = useSelector(getSelectedWidget);
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
  const dataTree = useSelector(getDataTree);
  const pageId = useSelector(getCurrentPageId);
  const applicationId = useSelector(getCurrentApplicationId);

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
          actionConfig?.getURL(
            applicationId,
            pageId || "",
            entity.actionId,
            entity.pluginType,
          );

        if (url) {
          history.push(url);
        }
      } else if (isJSAction(entity)) {
        history.push(
          JS_COLLECTION_ID_URL(applicationId, pageId, entity.actionId),
        );
      }
    },
    [dataTree],
  );

  return {
    navigateToEntity,
  };
};

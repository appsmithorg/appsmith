import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { ENTITY_TYPE, Log } from "entities/AppsmithConsole";
import { AppState } from "reducers";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/useNavigateToWidget";
import { getWidget } from "sagas/selectors";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction, getDatasource } from "selectors/entitiesSelector";
import { isWidget, isAction } from "workers/evaluationUtils";
import {
  onApiEditor,
  onQueryEditor,
  onCanvas,
  doesEntityHaveErrors,
} from "./helpers";
import history from "utils/history";
import { getSelectedWidget } from "selectors/ui";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { isEqual, keyBy } from "lodash";
import {
  getPluginIcon,
  getWidgetIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { isStoredDatasource } from "entities/Action";
import { getCurrentUser } from "selectors/usersSelectors";
import { getAppsmithConfigs } from "configs";

const { intercomAppID } = getAppsmithConfigs();

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

  const selectedWidget = useSelector(getSelectedWidget);
  const widget = useSelector((state: AppState) => {
    if (onCanvas(applicationId, currentPageId)) {
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
          actionConfig?.getURL(
            applicationId,
            pageId || "",
            entity.actionId,
            entity.pluginType,
          );

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

export const useGetEntityInfo = (name: string) => {
  const entity = useSelector((state: AppState) => state.evaluations.tree[name]);
  const debuggerErrors = useSelector(getDebuggerErrors);
  const action = useSelector((state: AppState) =>
    isAction(entity) ? getAction(state, entity.actionId) : undefined,
  );

  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  }, isEqual);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = action && getPluginIcon(pluginGroups[action.pluginId]);
  const datasource = useSelector((state: AppState) =>
    action && isStoredDatasource(action.datasource)
      ? getDatasource(state, action.datasource.id)
      : undefined,
  );

  const getEntityInfo = useCallback(() => {
    if (isWidget(entity)) {
      const icon = getWidgetIcon(entity.type);
      const hasError = doesEntityHaveErrors(entity.widgetId, debuggerErrors);

      return {
        name,
        icon,
        hasError,
        type: ENTITY_TYPE.WIDGET,
        entityType: entity.type,
      };
    } else if (isAction(entity)) {
      const hasError = doesEntityHaveErrors(entity.actionId, debuggerErrors);

      return {
        name,
        icon,
        datasourceName: datasource?.name ?? "",
        hasError,
        type: ENTITY_TYPE.ACTION,
        entityType: action?.pluginId ? pluginGroups[action.pluginId].name : "",
      };
    }
  }, [name]);

  return getEntityInfo;
};

export const useBootIntercom = () => {
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    if (intercomAppID && window.Intercom) {
      console.log("Intercom booted");
      window.Intercom("boot", {
        app_id: intercomAppID,
        user_id: user?.username,
        name: user?.name,
        email: user?.email,
      });
    }
  }, []);
};

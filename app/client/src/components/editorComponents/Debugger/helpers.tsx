import { ENTITY_TYPE, Message, Severity } from "entities/AppsmithConsole";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  createMessage,
  NO_LOGS,
  OPEN_THE_DEBUGGER,
  PRESS,
} from "constants/messages";
import { DependencyMap } from "utils/DynamicBindingUtils";
import {
  API_EDITOR_URL,
  QUERIES_EDITOR_URL,
  BUILDER_PAGE_URL,
} from "constants/routes";
import { useParams } from "react-router";
import { getWidget } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction } from "selectors/entitiesSelector";
import { getCurrentWidgetId } from "selectors/propertyPaneSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { getDataTree } from "selectors/dataTreeSelectors";
import { isWidget, isAction } from "workers/evaluationUtils";
import history from "utils/history";

const BlankStateWrapper = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${(props) => props.theme.colors.debugger.blankState.color};
  ${(props) => getTypographyByKey(props, "p1")}

  .debugger-shortcut {
    color: ${(props) => props.theme.colors.debugger.blankState.shortcut};
    ${(props) => getTypographyByKey(props, "h5")}
  }
`;

export function BlankState(props: { hasShortCut?: boolean }) {
  return (
    <BlankStateWrapper>
      {props.hasShortCut ? (
        <span>
          {createMessage(PRESS)}
          <span className="debugger-shortcut">Cmd + D</span>
          {createMessage(OPEN_THE_DEBUGGER)}
        </span>
      ) : (
        <span>{createMessage(NO_LOGS)}</span>
      )}
    </BlankStateWrapper>
  );
}

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

export const SeverityIconColor: Record<Severity, string> = {
  [Severity.INFO]: "#03B365",
  [Severity.ERROR]: "#F22B2B",
  [Severity.WARNING]: "rgb(224, 179, 14)",
};

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

export function getDependencies(
  deps: DependencyMap,
  entityName: string | null,
) {
  if (!entityName) return null;

  const directDependencies = new Set<string>();
  const inverseDependencies = new Set<string>();

  Object.entries(deps).forEach(([dependant, dependencies]) => {
    (dependencies as any).map((dependency: any) => {
      if (!dependant.includes(entityName) && dependency.includes(entityName)) {
        const entity = dependant
          .split(".")
          .slice(0, 1)
          .join("");

        directDependencies.add(entity);
      } else if (
        dependant.includes(entityName) &&
        !dependency.includes(entityName)
      ) {
        const entity = dependency
          .split(".")
          .slice(0, 1)
          .join("");

        inverseDependencies.add(entity);
      }
    });
  });

  return {
    inverseDependencies: Array.from(inverseDependencies),
    directDependencies: Array.from(directDependencies),
  };
}

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

  const selectedWidget = useSelector(getCurrentWidgetId);
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

const onApiEditor = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      API_EDITOR_URL(applicationId, currentPageId),
    ) > -1
  );
};

const onQueryEditor = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      QUERIES_EDITOR_URL(applicationId, currentPageId),
    ) > -1
  );
};

const onCanvas = (
  applicationId: string | undefined,
  currentPageId: string | undefined,
) => {
  return (
    window.location.pathname.indexOf(
      BUILDER_PAGE_URL(applicationId, currentPageId),
    ) > -1
  );
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

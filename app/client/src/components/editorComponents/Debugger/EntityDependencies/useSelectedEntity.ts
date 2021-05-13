import {
  API_EDITOR_URL,
  BUILDER_PAGE_URL,
  QUERIES_EDITOR_URL,
} from "constants/routes";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { useSelector } from "react-redux";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { getWidget } from "sagas/selectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction } from "selectors/entitiesSelector";
import { getCurrentWidgetId } from "selectors/propertyPaneSelectors";

const useSelectedEntity = () => {
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

export default useSelectedEntity;

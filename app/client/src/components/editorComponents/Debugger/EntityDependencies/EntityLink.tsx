import { useCallback } from "react";
import { getDataTree } from "selectors/dataTreeSelectors";
import { useSelector } from "react-redux";
import { isAction, isWidget } from "workers/evaluationUtils";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import history from "utils/history";

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

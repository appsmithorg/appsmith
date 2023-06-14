import {
  createMessage,
  ONBOARDING_CHECKLIST_HEADER,
  SIGNPOSTING_TOOLTIP,
  SIGNPOSTING_LAST_STEP_TOOLTIP,
  SIGNPOSTING_SUCCESS_POPUP,
} from "@appsmith/constants/messages";
import React from "react";
import { useSelector } from "react-redux";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  getCurrentPageId,
  getApplicationLastDeployedAt,
} from "selectors/editorSelectors";
import {
  getPageActions,
  getCanvasWidgets,
  getSavedDatasources,
} from "selectors/entitiesSelector";
import { useIsWidgetActionConnectionPresent } from "../utils";

function TooltipContent() {
  const datasources = useSelector(getSavedDatasources);
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const deps = useSelector(getEvaluationInverseDependencyMap);
  const isConnectionPresent = useIsWidgetActionConnectionPresent(
    widgets,
    actions,
    deps,
  );
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);

  let title = createMessage(ONBOARDING_CHECKLIST_HEADER);
  let content = createMessage(SIGNPOSTING_TOOLTIP.DEFAULT.content);
  const lastStepContent = createMessage(SIGNPOSTING_LAST_STEP_TOOLTIP);
  let completedTasks = 0;

  if (datasources.length) {
    completedTasks++;
  }
  if (actions.length) {
    completedTasks++;
  }
  if (Object.keys(widgets).length > 1) {
    completedTasks++;
  }
  if (isConnectionPresent) {
    completedTasks++;
  }
  if (isDeployed) {
    completedTasks++;
  }

  if (completedTasks > 0) {
    title = `${completedTasks}/5 Steps completed`;
  }

  if (!datasources.length) {
    content = createMessage(SIGNPOSTING_TOOLTIP.CONNECT_A_DATASOURCE.content);
  } else if (!actions.length && datasources.length) {
    content = createMessage(SIGNPOSTING_TOOLTIP.CREATE_QUERY.content);
  } else if (Object.keys(widgets).length === 1 && actions.length) {
    content = createMessage(SIGNPOSTING_TOOLTIP.ADD_WIDGET.content);
  } else if (!isConnectionPresent) {
    content = createMessage(SIGNPOSTING_TOOLTIP.CONNECT_DATA_TO_WIDGET.content);
  } else if (!isDeployed) {
    content = createMessage(SIGNPOSTING_TOOLTIP.DEPLOY_APPLICATION.content);
  }

  if (completedTasks === 0) {
    title = createMessage(ONBOARDING_CHECKLIST_HEADER);
    content = createMessage(SIGNPOSTING_TOOLTIP.DEFAULT.content);
  }

  if (completedTasks === 5)
    return <>{createMessage(SIGNPOSTING_SUCCESS_POPUP.title)}</>;

  return (
    <>
      {title}
      <br />
      <br />
      {completedTasks === 4 && (
        <>
          {lastStepContent}
          <br />
        </>
      )}
      {content}
    </>
  );
}

export default TooltipContent;

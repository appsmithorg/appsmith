import {
  createMessage,
  ONBOARDING_CHECKLIST_HEADER,
  SIGNPOSTING_TOOLTIP,
  SIGNPOSTING_LAST_STEP_TOOLTIP,
  SIGNPOSTING_SUCCESS_POPUP,
} from "ee/constants/messages";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentPageId,
  getApplicationLastDeployedAt,
} from "selectors/editorSelectors";
import {
  getPageActions,
  getCanvasWidgets,
  getSavedDatasources,
} from "ee/selectors/entitiesSelector";
import { showSignpostingTooltip } from "actions/onboardingActions";
import { SIGNPOSTING_STEP } from "./Utils";
import { isWidgetActionConnectionPresent } from "selectors/onboardingSelectors";

const SIGNPOSTING_STEPS = [
  SIGNPOSTING_STEP.CONNECT_A_DATASOURCE,
  SIGNPOSTING_STEP.CREATE_A_QUERY,
  SIGNPOSTING_STEP.ADD_WIDGETS,
  SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET,
  SIGNPOSTING_STEP.DEPLOY_APPLICATIONS,
];

function TooltipContent(props: { showSignpostingTooltip: boolean }) {
  const datasources = useSelector(getSavedDatasources);
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const isConnectionPresent = useSelector(isWidgetActionConnectionPresent);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const dispatch = useDispatch();

  let title = createMessage(ONBOARDING_CHECKLIST_HEADER);
  let content = createMessage(SIGNPOSTING_TOOLTIP.DEFAULT.content);
  const lastStepContent = createMessage(SIGNPOSTING_LAST_STEP_TOOLTIP);
  let completedTasks = 0;

  useEffect(() => {
    const handleEvent = () => {
      dispatch(showSignpostingTooltip(false));
    };

    document.addEventListener("mousemove", handleEvent, true);
    return () => {
      document.removeEventListener("mousemove", handleEvent, true);
    };
  }, []);

  useEffect(() => {
    if (!props.showSignpostingTooltip) return;

    const timer = setTimeout(() => {
      // After a step is completed we want to show the tooltip for 8 seconds and then hide it.
      dispatch(showSignpostingTooltip(false));
    }, 8000);

    return () => {
      clearTimeout(timer);
    };
  }, [props.showSignpostingTooltip]);

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
    title = `✅ ${completedTasks}/5 done.`;
  }

  if (!datasources.length && !actions.length) {
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

  if (completedTasks === SIGNPOSTING_STEPS.length)
    return <>{createMessage(SIGNPOSTING_SUCCESS_POPUP.title)}</>;

  return (
    <>
      {title}
      <br />
      <br />
      {completedTasks === SIGNPOSTING_STEPS.length - 1 && (
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

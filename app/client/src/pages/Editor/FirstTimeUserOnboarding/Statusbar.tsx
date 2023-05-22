import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import type { SyntheticEvent } from "react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  getApplicationLastDeployedAt,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import {
  getFirstTimeUserOnboardingComplete,
  getInOnboardingWidgetSelection,
} from "selectors/onboardingSelectors";
import styled from "styled-components";
import history from "utils/history";
import {
  ONBOARDING_STATUS_STEPS_FIRST,
  ONBOARDING_STATUS_STEPS_FIRST_ALT,
  ONBOARDING_STATUS_STEPS_SECOND,
  ONBOARDING_STATUS_STEPS_THIRD,
  ONBOARDING_STATUS_STEPS_FOURTH,
  ONBOARDING_STATUS_STEPS_FIVETH,
  ONBOARDING_STATUS_STEPS_SIXTH,
  ONBOARDING_STATUS_GET_STARTED,
  createMessage,
  ONBOARDING_STATUS_STEPS_THIRD_ALT,
} from "@appsmith/constants/messages";
import { getTypographyByKey } from "design-system-old";
import { onboardingCheckListUrl } from "RouteBuilder";
import { Icon, Button } from "design-system";

const Wrapper = styled.div<{ active: boolean }>`
  width: 100%;
  background-color: ${(props) =>
    props.active ? "var(--ads-v2-color-bg-brand)" : ""};
  cursor: ${(props) => (props.active ? "default" : "pointer")};
  height: ${(props) => props.theme.onboarding.statusBarHeight}px;
  padding: 12px 16px;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid var(--ads-v2-color-border);

  ${(props) =>
    props.active &&
    `
      p {
        color: var(--ads-v2-color-fg-on-brand);
      }
      svg, svg path {
        fill: var(--ads-v2-color-fg-on-brand) !important;
      }
  `}

  &:hover .hover-icons {
    opacity: 1;
  }
`;

const TitleWrapper = styled.p`
  ${getTypographyByKey("p4")}
  color: var(--ads-v2-color-fg);
`;

const StatusText = styled.p`
  font-size: 13px;
  display: flex;
  & .hover-icons {
    transform: translate(3px, 0px);
    opacity: 0;
  }
`;

const ProgressContainer = styled.div<StatusProgressbarContainerType>`
  background-color: ${(props) =>
    props.active
      ? "var(--ads-v2-color-bg-brand-emphasis-plus)"
      : "var(--ads-v2-color-bg-subtle)"};
  border-radius: var(--ads-v2-border-radius);
  overflow: hidden;
  margin-top: 12px;
`;

const Progressbar = styled.div<StatusProgressbarType>`
  width: ${(props) => props.percentage}%;
  height: 6px;
  background: ${(props) =>
    props.active
      ? "var(--ads-v2-color-bg)"
      : "var(--ads-v2-color-bg-brand-emphasis-plus)"};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: var(--ads-v2-border-radius);
`;

const StyledClose = styled(Button)`
  position: absolute !important;
  top: 9px;
  right: 9px;
  opacity: 0;
  cursor: pointer;
`;

type StatusProgressbarType = {
  percentage: number;
  active: boolean;
};
type StatusProgressbarContainerType = {
  active: boolean;
};

export function StatusProgressbar(props: StatusProgressbarType) {
  return (
    <ProgressContainer {...props}>
      <Progressbar {...props} />
    </ProgressContainer>
  );
}

const useStatus = (): { percentage: number; content: string } => {
  const datasources = useSelector(getDatasources);
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
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  const inOnboardingWidgetSelection =
    useSelector(getInOnboardingWidgetSelection) &&
    Object.keys(widgets).length === 1;

  if (isFirstTimeUserOnboardingComplete) {
    return {
      percentage: 100,
      content: createMessage(ONBOARDING_STATUS_STEPS_SIXTH),
    };
  }

  let content = "";
  let percentage = 0;
  if (!datasources.length && !actions.length && !inOnboardingWidgetSelection) {
    content =
      Object.keys(widgets).length === 1
        ? createMessage(ONBOARDING_STATUS_STEPS_FIRST)
        : createMessage(ONBOARDING_STATUS_STEPS_FIRST_ALT);
  } else if (!actions.length && !inOnboardingWidgetSelection) {
    content = createMessage(ONBOARDING_STATUS_STEPS_SECOND);
  } else if (Object.keys(widgets).length === 1) {
    content =
      !datasources.length && !actions.length
        ? createMessage(ONBOARDING_STATUS_STEPS_THIRD_ALT)
        : createMessage(ONBOARDING_STATUS_STEPS_THIRD);
  } else if (!isConnectionPresent) {
    content = createMessage(ONBOARDING_STATUS_STEPS_FOURTH);
  } else if (!isDeployed) {
    content = createMessage(ONBOARDING_STATUS_STEPS_FIVETH);
  } else {
    content = createMessage(ONBOARDING_STATUS_STEPS_SIXTH);
  }

  if (datasources.length || actions.length) {
    percentage += 20;
  }

  if (actions.length) {
    percentage += 20;
  }

  if (Object.keys(widgets).length > 1) {
    percentage += 20;
  }

  if (isConnectionPresent) {
    percentage += 20;
  }

  if (isDeployed) {
    percentage += 20;
  }

  return {
    percentage,
    content,
  };
};

export function OnboardingStatusbar(props: RouteComponentProps) {
  const dispatch = useDispatch();
  const pageId = useSelector(getCurrentPageId);
  const { content, percentage } = useStatus();
  const isChecklistPage = props.location.pathname.indexOf("/checklist") > -1;
  const isGenerateAppPage =
    props.location.pathname.indexOf("/generate-page/form") > -1;
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  if (isGenerateAppPage) {
    return null;
  }
  const endFirstTimeUserOnboarding = (event?: SyntheticEvent) => {
    event?.stopPropagation();
    dispatch({
      type: ReduxActionTypes.END_FIRST_TIME_USER_ONBOARDING,
    });
  };
  if (percentage === 100 && !isFirstTimeUserOnboardingComplete) {
    dispatch({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
      payload: true,
    });
  }

  return (
    <Wrapper
      active={isChecklistPage}
      className="sticky top-0 t--onboarding-statusbar"
      data-testid="statusbar-container"
      onClick={() => {
        history.push(onboardingCheckListUrl({ pageId }));
      }}
    >
      <StyledClose
        className="hover-icons"
        data-testid="statusbar-skip"
        isIconButton
        kind={isChecklistPage ? "primary" : "tertiary"}
        onClick={endFirstTimeUserOnboarding}
        size="sm"
        startIcon="close-control"
      />
      <TitleWrapper>
        {createMessage(ONBOARDING_STATUS_GET_STARTED)}
      </TitleWrapper>
      <StatusText className="mt-1">
        <span data-testid="statusbar-text">{content}</span>&nbsp;&nbsp;
        {!isChecklistPage && (
          <Icon className="hover-icons" name="right-arrow-2" size="md" />
        )}
      </StatusText>
      <StatusProgressbar
        active={isChecklistPage}
        data-testid="statusbar-text"
        percentage={percentage}
      />
    </Wrapper>
  );
}

export default withRouter(OnboardingStatusbar);

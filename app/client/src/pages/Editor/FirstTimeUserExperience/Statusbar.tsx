import { Icon } from "@blueprintjs/core";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getOnboardingCheckListUrl } from "constants/routes";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import React, { SyntheticEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActions,
  getCanvasWidgets,
  getDatasources,
} from "selectors/entitiesSelector";
import { getFirstTimeUserExperienceComplete } from "selectors/onboardingSelectors";
import styled from "styled-components";
import history from "utils/history";
import {
  ONBOARDING_STEPS_FIRST,
  ONBOARDING_STEPS_FIRST_ALT,
  ONBOARDING_STEPS_SECOND,
  ONBOARDING_STEPS_THIRD,
  ONBOARDING_STEPS_FOURTH,
  ONBOARDING_STEPS_FIVETH,
  ONBOARDING_STEPS_SIXTH,
} from "./constants";

const Wrapper = styled.div<{ active: boolean }>`
  position: relative;
  width: 100%;
  background-color: ${(props) =>
    props.active ? props.theme.colors.welcomeTourStickySidebarBackground : ""};
  cursor: ${(props) => (props.active ? "default" : "pointer")};
  height: 83px;
  padding: 10px 16px;
  transition: background-color 0.3s ease;

  &:hover .hover-icons {
    opacity: 1;
  }
`;

const TitleWrapper = styled.p`
  color: #fff;
  font-size: 13px;
  font-weight: 600;
`;

const StatusText = styled.p`
  color: #fff;
  font-size: 13px;
  & .hover-icons {
    transform: translate(3px, 0px);
    opacity: 0;
  }
`;

const ProgressContainer = styled.div`
  background-color: rgb(255, 255, 255, 0.35);
  border-radius: ${(props) => props.theme.radii[3]}px;
  overflow: hidden;
  margin-top: 12px;
`;

const Progressbar = styled.div<StatusProgressbarType>`
  width: ${(props) => props.percentage}%;
  height: 6px;
  background: ${(props) =>
    props.active
      ? "#fff"
      : props.theme.colors.welcomeTourStickySidebarBackground};
  transition: width 0.3s ease, background 0.3s ease;
  border-radius: ${(props) => props.theme.radii[3]}px;
`;

const StyledClose = styled(Icon)`
  position: absolute;
  top: 15px;
  right: 13px;
  opacity: 0;
`;

type StatusProgressbarType = {
  percentage: number;
  active: boolean;
};

export function StatusProgressbar(props: StatusProgressbarType) {
  return (
    <ProgressContainer>
      <Progressbar {...props} />
    </ProgressContainer>
  );
}

const useStatus = (): { percentage: number; content: string } => {
  const datasources = useSelector(getDatasources);
  const actions = useSelector(getActions);
  const widgets = useSelector(getCanvasWidgets);
  const deps = useSelector(getEvaluationInverseDependencyMap);
  const isConnectionPresent = useIsWidgetActionConnectionPresent(
    widgets,
    actions,
    deps,
  );
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const isFirstTimeUserExperienceComplete = useSelector(
    getFirstTimeUserExperienceComplete,
  );

  if (isFirstTimeUserExperienceComplete) {
    return {
      percentage: 100,
      content: "Completed 🎉",
    };
  }

  let content = "";
  let percentage = 0;
  if (!datasources.length && !actions.length) {
    content =
      Object.keys(widgets).length == 1
        ? ONBOARDING_STEPS_FIRST
        : ONBOARDING_STEPS_FIRST_ALT;
  } else if (!actions.length) {
    content = ONBOARDING_STEPS_SECOND;
  } else if (Object.keys(widgets).length == 1) {
    content = ONBOARDING_STEPS_THIRD;
  } else if (!isConnectionPresent) {
    content = ONBOARDING_STEPS_FOURTH;
  } else if (!isDeployed) {
    content = ONBOARDING_STEPS_FIVETH;
  } else {
    content = ONBOARDING_STEPS_SIXTH;
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
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const { content, percentage } = useStatus();
  const isChecklistPage = props.location.pathname.indexOf("/checklist") > -1;
  const isGenerateAppPage =
    props.location.pathname.indexOf("/generate-page/form") > -1;
  if (isGenerateAppPage) {
    return null;
  }
  const endFirstTimeUserExperience = (event?: SyntheticEvent) => {
    event?.stopPropagation();
    dispatch({
      type: ReduxActionTypes.END_FIRST_TIME_USER_EXPERIENCE,
    });
  };
  if (percentage == 100) {
    dispatch({
      type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_EXPERIENCE,
      payload: false,
    });
    dispatch({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_APPLICATION_ID,
      payload: "",
    });
    dispatch({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_COMPLETE,
      payload: true,
    });
  }

  return (
    <Wrapper
      active={isChecklistPage}
      data-testid="statusbar-container"
      onClick={() => {
        history.push(getOnboardingCheckListUrl(applicationId, pageId));
      }}
    >
      <StyledClose
        className="hover-icons"
        color="#fff"
        data-cy="statusbar-skip"
        icon="cross"
        iconSize={14}
        onClick={endFirstTimeUserExperience}
      />
      <TitleWrapper>GET STARTED</TitleWrapper>
      <StatusText>
        <span data-testid="statusbar-text">{content}</span>&nbsp;&nbsp;
        {!isChecklistPage && (
          <Icon
            className="hover-icons"
            color="#fff"
            icon="chevron-right"
            iconSize={14}
          />
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

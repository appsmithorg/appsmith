import { Icon } from "@blueprintjs/core";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getOnboardingCheckListUrl } from "constants/routes";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getActions,
  getCanvasWidgets,
  getDatasources,
} from "selectors/entitiesSelector";
import styled from "styled-components";

const Wrapper = styled.div<{ active: boolean }>`
  position: relative;
  width: 100%;
  background-color: ${(props) =>
    props.active ? props.theme.colors.welcomeTourStickySidebarBackground : ""};
  height: 83px;
  padding: 12px 16px;
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

const StatusText = styled.p<{ active: boolean }>`
  color: #fff;
  cursor: ${(props) => (props.active ? "default" : "pointer")};
  font-size: 13px;
  & span {
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

const Progressbar = styled.div<{ percentage: number }>`
  width: ${(props) => props.percentage}%;
  height: 4px;
  background: #fff;
  transition: width 0.3s ease;
`;

const StyledLink = styled(Link)`
  &:hover {
    text-decoration: none;
  }
`;

const StyledClose = styled(Icon)`
  position: absolute;
  top: 15px;
  right: 13px;
  opacity: 0;
`;

function StatusProgressbar(props: any) {
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
  const isDeployed = true;

  let content = "";
  let percentage = 0;
  if (!datasources.length) {
    content = `${
      Object.keys(widgets).length == 1 ? "First" : "Next"
    }: Add a Datasource`;
  } else if (!actions.length) {
    content = `Next: Add a Query`;
  } else if (Object.keys(widgets).length == 1) {
    content = `Next: Add a Widget`;
  } else if (!isConnectionPresent) {
    content = `Next: Connect data to Widget`;
  } else if (!isDeployed) {
    content = `Next: Deploy your application`;
  } else {
    content = `Completed 🎉`;
  }

  if (datasources.length) {
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

export function OnboardingStatusbar() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const { content, percentage } = useStatus();
  const isChecklistPage = window.location.pathname.indexOf("/checklist") > -1;
  const isGenerateAppPage =
    window.location.pathname.indexOf("/generate-page/form") > -1;
  if (isGenerateAppPage) {
    return null;
  }
  const endFirstTimeUserExperience = () => {
    dispatch({
      type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_EXPERIENCE,
      payload: false,
    });
    dispatch({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_APPLICATION_ID,
      payload: "",
    });
  };
  if (percentage == 100) {
    endFirstTimeUserExperience();
    dispatch({
      type: ReduxActionTypes.SET_FIRST_TIME_USER_EXPERIENCE_COMPLETE,
      payload: true,
    });
  }

  return (
    <Wrapper active={isChecklistPage}>
      <StyledClose
        className="hover-icons"
        color="#fff"
        icon="cross"
        iconSize={14}
        onClick={endFirstTimeUserExperience}
      />
      <TitleWrapper>GET STARTED</TitleWrapper>
      <StyledLink to={getOnboardingCheckListUrl(applicationId, pageId)}>
        <StatusText active={isChecklistPage}>
          {content}&nbsp;&nbsp;
          {!isChecklistPage && (
            <Icon
              className="hover-icons"
              color="#fff"
              icon="chevron-right"
              iconSize={14}
            />
          )}
        </StatusText>
      </StyledLink>
      <StatusProgressbar percentage={percentage} />
    </Wrapper>
  );
}

export default withRouter(OnboardingStatusbar);

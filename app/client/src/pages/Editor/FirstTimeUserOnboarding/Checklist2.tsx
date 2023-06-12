/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Button,
  Divider,
  Icon,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Text,
} from "design-system";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  getCanvasWidgets,
  getDatasources,
  getPageActions,
} from "selectors/entitiesSelector";
import { useIsWidgetActionConnectionPresent } from "pages/Editor/utils";
import { getEvaluationInverseDependencyMap } from "selectors/dataTreeSelectors";
import { APPLICATIONS_URL, INTEGRATION_TABS } from "constants/routes";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import history from "utils/history";
import { toggleInOnboardingWidgetSelection } from "actions/onboardingActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import { Redirect } from "react-router";
import {
  ONBOARDING_CHECKLIST_ACTIONS,
  ONBOARDING_CHECKLIST_BANNER_BODY,
  ONBOARDING_CHECKLIST_BANNER_HEADER,
  ONBOARDING_CHECKLIST_HEADER,
  ONBOARDING_CHECKLIST_BODY,
  ONBOARDING_CHECKLIST_COMPLETE_TEXT,
  ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE,
  ONBOARDING_CHECKLIST_CREATE_A_QUERY,
  ONBOARDING_CHECKLIST_ADD_WIDGETS,
  ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET,
  ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS,
  ONBOARDING_CHECKLIST_FOOTER,
  ONBOARDING_CHECKLIST_BANNER_BUTTON,
  createMessage,
  SIGNPOSTING_POPUP_SUBTITLE,
  SIGNPOSTING_INFO_MENU,
} from "@appsmith/constants/messages";
import type { Datasource } from "entities/Datasource";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { triggerWelcomeTour } from "./Utils";
import { builderURL, integrationEditorURL } from "RouteBuilder";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import classNames from "classnames";

const Wrapper = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-5);
`;

const StyledDivider = styled(Divider)`
  display: block;
`;

const PrefixCircle = styled.div<{ active: boolean }>`
  height: 13px;
  width: 13px;
  border-radius: 50%;
  border: 1px solid
    ${(props) =>
      props.active
        ? "var(--ads-v2-color-bg-brand-secondary)"
        : "var(--ads-v2-color-fg-subtle)"};
`;

const ListItem = styled.div<{ active: boolean }>`
  &:hover {
    background-color: ${(props) =>
      props.active ? "var(--ads-v2-color-bg-subtle)" : "transparent"};
  }
  padding: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
  border-radius: var(--ads-v2-border-radius);
  cursor: ${(props) => (props.active ? "pointer" : "not-allowed")};
`;

const CHECKLIST_WIDTH_OFFSET = 268;

function getSuggestedNextActionAndCompletedTasks(
  datasources: Datasource[],
  actions: ActionDataState,
  widgets: CanvasWidgetsReduxState,
  isConnectionPresent: boolean,
  isDeployed: boolean,
) {
  let suggestedNextAction;
  if (!datasources.length) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_A_DATASOURCE,
    );
  } else if (!actions.length) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CREATE_A_QUERY,
    );
  } else if (Object.keys(widgets).length === 1) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.ADD_WIDGETS,
    );
  } else if (!isConnectionPresent) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.CONNECT_DATA_TO_WIDGET,
    );
  } else if (!isDeployed) {
    suggestedNextAction = createMessage(
      () => ONBOARDING_CHECKLIST_ACTIONS.DEPLOY_APPLICATIONS,
    );
  }
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

  return { suggestedNextAction, completedTasks };
}

function CheckListItem(props: {
  boldText: string;
  normalPrefixText?: string;
  normalText: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <div className="flex pt-2 flex-1 flex-col">
      <ListItem
        active={props.active}
        className={classNames({
          "flex items-center justify-between": true,
        })}
        onClick={props.onClick}
      >
        <div className="flex items-center gap-2.5">
          <PrefixCircle active={props.active} />
          <div>
            <Text
              color={
                props.active
                  ? "var(--ads-v2-color-bg-brand-secondary)"
                  : "var(--ads-v2-color-fg-subtle)"
              }
              kind="heading-xs"
            >
              {props.boldText}
            </Text>
            {props.normalPrefixText && (
              <Text color={props.active ? "" : "var(--ads-v2-color-fg-subtle)"}>
                &nbsp;{props.normalText}
              </Text>
            )}
            <br />
            <Text color={props.active ? "" : "var(--ads-v2-color-fg-subtle)"}>
              {props.normalText}
            </Text>
          </div>
        </div>
        <Menu>
          <MenuTrigger disabled={!props.active}>
            <Button
              isDisabled={!props.active}
              isIconButton
              kind="tertiary"
              startIcon="question-line"
            />
          </MenuTrigger>
          <MenuContent>
            <MenuItem
              disabled={!props.active}
              onSelect={() => {
                window.open("https://docs.appsmith.com/", "_blank");
              }}
              startIcon="book-line"
            >
              {createMessage(SIGNPOSTING_INFO_MENU.documentation)}
            </MenuItem>
          </MenuContent>
        </Menu>
      </ListItem>
      <StyledDivider className="mt-0.5" />
    </div>
  );
}

export default function OnboardingChecklist() {
  const dispatch = useDispatch();
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
  // const theme = useSelector(getCurrentThemeDetails);
  const applicationId = useSelector(getCurrentApplicationId);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  // TODO
  //   if (!isFirstTimeUserOnboardingEnabled && !isCompleted) {
  //     return <Redirect to={builderURL({ pageId })} />;
  //   }
  const { completedTasks } = getSuggestedNextActionAndCompletedTasks(
    datasources,
    actions,
    widgets,
    isConnectionPresent,
    isDeployed,
  );
  const onconnectYourWidget = () => {
    const action = actions[0];
    if (action && applicationId && pageId) {
      dispatch(
        bindDataOnCanvas({
          queryId: action.config.id,
          applicationId,
          pageId,
        }),
      );
    } else {
      history.push(builderURL({ pageId }));
    }
    AnalyticsUtil.logEvent("SIGNPOSTING_CONNECT_WIDGET_CLICK");
  };
  return (
    <Wrapper>
      <div className="flex justify-between pb-4">
        <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-m">
          {createMessage(ONBOARDING_CHECKLIST_HEADER)}
        </Text>
        {/* TODO: size looks small */}
        <Button isIconButton kind="tertiary" startIcon={"close-line"} />
      </div>
      <Text color="var(--ads-v2-color-bg-brand-secondary)" kind="heading-xs">
        {createMessage(SIGNPOSTING_POPUP_SUBTITLE)}
      </Text>
      <div className="mt-5">
        <Text color="var(--ads-v2-color-bg-brand-secondary)" kind="heading-xs">
          {completedTasks} of 5{" "}
        </Text>
        <Text>complete</Text>
      </div>
      <StyledDivider className="mt-1" />
      {/* Datasources */}
      <CheckListItem
        active={!datasources.length && !actions.length}
        boldText={createMessage(ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.bold)}
        normalText={createMessage(
          ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.normal,
        )}
        onClick={() => {
          AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_DATASOURCE_CLICK", {
            from: "CHECKLIST",
          });
          history.push(
            integrationEditorURL({
              pageId,
              selectedTab: INTEGRATION_TABS.NEW,
            }),
          );
        }}
      />
      <CheckListItem
        active={!actions.length}
        boldText={createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.bold)}
        normalPrefixText={createMessage(
          ONBOARDING_CHECKLIST_CREATE_A_QUERY.normalPrefix,
        )}
        normalText={createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.normal)}
        onClick={() => {
          AnalyticsUtil.logEvent("SIGNPOSTING_CREATE_QUERY_CLICK", {
            from: "CHECKLIST",
          });
          history.push(
            integrationEditorURL({
              pageId,
              selectedTab: INTEGRATION_TABS.ACTIVE,
            }),
          );
          // Event for datasource creation click
          const entryPoint = DatasourceCreateEntryPoints.NEW_APP_CHECKLIST;
          AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
            entryPoint,
          });
        }}
      />
      <CheckListItem
        active={Object.keys(widgets).length === 1}
        boldText={createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.bold)}
        normalText={createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.normal)}
        onClick={() => {
          AnalyticsUtil.logEvent("SIGNPOSTING_ADD_WIDGET_CLICK", {
            from: "CHECKLIST",
          });
          dispatch(toggleInOnboardingWidgetSelection(true));
          dispatch(forceOpenWidgetPanel(true));
          history.push(builderURL({ pageId }));
        }}
      />
      <CheckListItem
        active={!isConnectionPresent}
        boldText={createMessage(
          ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.bold,
        )}
        normalText={createMessage(
          ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.normal,
        )}
        onClick={onconnectYourWidget}
      />
      <CheckListItem
        active={!isDeployed}
        boldText={createMessage(ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.bold)}
        normalText={createMessage(
          ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.normal,
        )}
        onClick={() => {
          AnalyticsUtil.logEvent("SIGNPOSTING_PUBLISH_CLICK", {
            from: "CHECKLIST",
          });
          dispatch({
            type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
            payload: {
              applicationId,
            },
          });
        }}
      />
    </Wrapper>
  );
}

import React, { useEffect, useRef } from "react";
import { Button, Divider, Text, Tooltip } from "@appsmith/ads";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  getCanvasWidgets,
  getPageActions,
  getSavedDatasources,
} from "ee/selectors/entitiesSelector";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getApplicationLastDeployedAt,
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import history from "utils/history";
import {
  setSignpostingOverlay,
  showSignpostingModal,
  showSignpostingTooltip,
  signpostingMarkAllRead,
  toggleInOnboardingWidgetSelection,
} from "actions/onboardingActions";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  getFirstTimeUserOnboardingComplete,
  getSignpostingStepStateByStep,
  isWidgetActionConnectionPresent,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { forceOpenWidgetPanel } from "actions/widgetSidebarActions";
import { bindDataOnCanvas } from "actions/pluginActionActions";
import {
  ONBOARDING_CHECKLIST_ACTIONS,
  ONBOARDING_CHECKLIST_HEADER,
  ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE,
  ONBOARDING_CHECKLIST_CREATE_A_QUERY,
  ONBOARDING_CHECKLIST_ADD_WIDGETS,
  ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET,
  ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS,
  createMessage,
  SIGNPOSTING_POPUP_SUBTITLE,
  SIGNPOSTING_SUCCESS_POPUP,
  SIGNPOSTING_TOOLTIP,
} from "ee/constants/messages";
import type { Datasource } from "entities/Datasource";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { SIGNPOSTING_STEP } from "./Utils";
import { builderURL, integrationEditorURL } from "ee/RouteBuilder";
import { DatasourceCreateEntryPoints } from "constants/Datasource";
import classNames from "classnames";
import lazyLottie from "utils/lazyLottie";
import tickMarkAnimationURL from "assets/lottie/guided-tour-tick-mark.json.txt";
import { getAppsmithConfigs } from "ee/configs";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
const { intercomAppID } = getAppsmithConfigs();

const StyledDivider = styled(Divider)`
  display: block;
`;

const PrefixCircle = styled.div<{ disabled: boolean }>`
  height: 13px;
  width: 13px;
  border-radius: 50%;
  border: 1px solid
    ${(props) =>
      !props.disabled
        ? "var(--ads-v2-color-bg-brand-secondary)"
        : "var(--ads-v2-color-fg-subtle)"};
`;

const LottieAnimationContainer = styled.div`
  height: 36px;
  width: 36px;
  left: -12px;
  top: -13px;
  position: absolute;
`;

const LottieAnimationWrapper = styled.div`
  height: 13px;
  width: 13px;
  position: relative;
`;

const ListItem = styled.div<{ disabled: boolean; completed: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  position: relative;
  cursor: ${(props) => {
    if (props.disabled) {
      return "not-allowed";
    } else if (props.completed) {
      return "auto";
    }

    return "pointer;";
  }};

  // Strikethrought animation
  .signposting-strikethrough {
    position: relative;
  }
  .signposting-strikethrough-static {
    text-decoration: line-through;
  }
  .signposting-strikethrough {
    background-image: linear-gradient(black, black);
    background-repeat: no-repeat;
    background-size: 0% 1px;
    background-position: 0% 50%;
    animation-duration: 2s;
    animation-fill-mode: forwards;
  }
  .signposting-strikethrough {
    -webkit-animation-name: bounceInLeft;
    animation-name: bounceInLeft;
  }
  .signposting-strikethrough-bold {
    -webkit-animation-name: signposting-strikethrough-bold;
    animation-name: signposting-strikethrough-bold;
  }
  .signposting-strikethrough-normal {
    -webkit-animation-name: signposting-strikethrough-normal;
    animation-name: signposting-strikethrough-normal;
  }
  @keyframes signposting-strikethrough-bold {
    0% {
      background-size: 0% 1px;
    }
    50% {
      background-size: 100% 1px;
    }
    100% {
      background-size: 100% 1px;
    }
  }
  @keyframes signposting-strikethrough-normal {
    30% {
      background-size: 0% 1px;
    }
    100% {
      background-size: 100% 1px;
    }
  }
`;

const Sibling = styled.div<{ disabled: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  &:hover {
    background-color: ${(props) =>
      !props.disabled ? "var(--ads-v2-color-bg-subtle)" : "transparent"};
  }
  padding: var(--ads-v2-spaces-3);
  padding-right: var(--ads-v2-spaces-2);
`;

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
  disabled: boolean;
  completed: boolean;
  step: SIGNPOSTING_STEP;
  docLink?: string;
  testid: string;
}) {
  const stepState = useSelector((state) =>
    getSignpostingStepStateByStep(state, props.step),
  );
  const tickMarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.completed) {
      const anim = lazyLottie.loadAnimation({
        path: tickMarkAnimationURL,
        container: tickMarkRef?.current as HTMLDivElement,
        renderer: "svg",
        loop: false,
        autoplay: false,
      });

      if (!stepState?.read) {
        anim.play();
      } else {
        // We want to show animation only for the first time. Once completed we show the last frame.
        // Here 60 is the last frame
        anim.goToAndStop(60, true);
      }

      return () => {
        anim.destroy();
      };
    }
  }, [tickMarkRef?.current, props.completed, stepState?.read]);

  return (
    <div className="flex pt-0.5 flex-1 flex-col">
      <ListItem
        className={classNames({
          "flex items-center justify-between": true,
        })}
        completed={props.completed}
        data-testid={props.testid}
        disabled={props.disabled}
        onClick={
          props.completed || props.disabled
            ? () => null
            : () => {
                props.onClick();
              }
        }
      >
        <Sibling
          className="flex flex-1 items-center gap-2.5"
          disabled={props.disabled}
        >
          {props.completed ? (
            <LottieAnimationWrapper>
              <LottieAnimationContainer ref={tickMarkRef} />
            </LottieAnimationWrapper>
          ) : (
            <PrefixCircle disabled={props.disabled} />
          )}
          <div className="pr-3">
            <Text
              className={classNames({
                "signposting-strikethrough-bold":
                  props.completed && !stepState?.read,
                "signposting-strikethrough-static":
                  props.completed && stepState?.read,
                "signposting-strikethrough": true,
              })}
              color={
                !props.disabled
                  ? "var(--ads-v2-color-bg-brand-secondary)"
                  : "var(--ads-v2-color-fg-subtle)"
              }
              kind="heading-xs"
            >
              {props.boldText}
              {props.normalPrefixText && (
                <Text
                  color={!props.disabled ? "" : "var(--ads-v2-color-fg-subtle)"}
                >
                  &nbsp;{props.normalPrefixText}
                </Text>
              )}
            </Text>
            <br />
            <Text
              className={classNames({
                "signposting-strikethrough-normal":
                  props.completed && !stepState?.read,
                "signposting-strikethrough-static":
                  props.completed && stepState?.read,
                "signposting-strikethrough": true,
              })}
              color={!props.disabled ? "" : "var(--ads-v2-color-fg-subtle)"}
            >
              {props.normalText}
            </Text>
          </div>
        </Sibling>
        <Tooltip
          align={{
            targetOffset: [13, 0],
          }}
          content={createMessage(SIGNPOSTING_TOOLTIP.DOCUMENTATION.content)}
          isDisabled={props.disabled}
          placement={"bottomLeft"}
        >
          <div className="absolute right-3">
            <Button
              isDisabled={props.disabled}
              isIconButton
              kind="tertiary"
              onClick={(e) => {
                AnalyticsUtil.logEvent("SIGNPOSTING_INFO_CLICK", {
                  step: props.step,
                });
                window.open(props.docLink ?? DOCS_BASE_URL, "_blank");
                e.stopPropagation();
              }}
              startIcon="book-line"
            />
          </div>
        </Tooltip>
      </ListItem>
      <StyledDivider className="mt-0.5" />
    </div>
  );
}

export default function OnboardingChecklist() {
  const dispatch = useDispatch();
  const datasources = useSelector(getSavedDatasources);
  const pageId = useSelector(getCurrentPageId);
  const basePageId = useSelector(getCurrentBasePageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const isConnectionPresent = useSelector(isWidgetActionConnectionPresent);
  const applicationId = useSelector(getCurrentApplicationId);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const { completedTasks } = getSuggestedNextActionAndCompletedTasks(
    datasources,
    actions,
    widgets,
    isConnectionPresent,
    isDeployed,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );

  const onconnectYourWidget = () => {
    const action = actions[0];

    dispatch(showSignpostingModal(false));

    if (action && applicationId && basePageId) {
      dispatch(
        bindDataOnCanvas({
          queryId: action.config.id,
          applicationId,
          basePageId,
        }),
      );
    } else {
      history.push(builderURL({ basePageId }));
    }

    AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_CONNECT_WIDGET_CLICK");
  };

  useEffect(() => {
    if (intercomAppID && window.Intercom) {
      // Close signposting modal when intercom modal is open
      window.Intercom("onShow", () => {
        dispatch(showSignpostingModal(false));
      });
    }

    return () => {
      dispatch(signpostingMarkAllRead());
      dispatch(setSignpostingOverlay(false));
      dispatch(showSignpostingTooltip(false));
    };
  }, []);

  // End signposting for the application once signposting is complete and the
  // signposting complete menu is closed
  useEffect(() => {
    return () => {
      if (isFirstTimeUserOnboardingComplete) {
        dispatch({
          type: ReduxActionTypes.END_FIRST_TIME_USER_ONBOARDING,
        });
      }
    };
  }, [isFirstTimeUserOnboardingComplete]);

  // Success UI
  if (isFirstTimeUserOnboardingComplete) {
    return (
      <>
        <div
          className="flex justify-between pb-3 items-center"
          data-testid="checklist-completion-banner"
        >
          <Text
            className="flex-1"
            color="var(--ads-v2-color-fg-emphasis)"
            kind="heading-m"
          >
            {createMessage(SIGNPOSTING_SUCCESS_POPUP.title)}
          </Text>
          <Button
            isIconButton
            kind="tertiary"
            onClick={() => {
              dispatch(showSignpostingModal(false));
            }}
            startIcon={"close-line"}
          />
        </div>
        <Text color="var(--ads-v2-color-bg-brand-secondary)" kind="heading-xs">
          {createMessage(SIGNPOSTING_SUCCESS_POPUP.subtitle)}
        </Text>
        <StyledDivider className="mt-4" />
      </>
    );
  }

  return (
    <>
      <div className="flex-1">
        <div className="flex justify-between pb-3 items-center">
          <Text color="var(--ads-v2-color-fg-emphasis)" kind="heading-m">
            {createMessage(ONBOARDING_CHECKLIST_HEADER)}
          </Text>
          <Button
            data-testid="signposting-modal-close-btn"
            isIconButton
            kind="tertiary"
            onClick={() => {
              AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_CLOSE_CLICK");
              dispatch(showSignpostingModal(false));
            }}
            startIcon={"close-line"}
          />
        </div>
        <Text color="var(--ads-v2-color-bg-brand-secondary)" kind="heading-xs">
          {createMessage(SIGNPOSTING_POPUP_SUBTITLE)}
        </Text>
        <div className="mt-5">
          <Text
            color="var(--ads-v2-color-bg-brand-secondary)"
            data-testid="checklist-completion-info"
            kind="heading-xs"
          >
            {completedTasks} of 5{" "}
          </Text>
          <Text>steps complete</Text>
        </div>
        <StyledDivider className="mt-1" />
      </div>
      <div
        className="overflow-auto min-h-[60px]"
        data-testid="checklist-wrapper"
      >
        <CheckListItem
          boldText={createMessage(
            ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.bold,
          )}
          completed={!!(datasources.length || actions.length)}
          disabled={false}
          docLink="https://docs.appsmith.com/core-concepts/connecting-to-data-sources"
          normalText={createMessage(
            ONBOARDING_CHECKLIST_CONNECT_DATA_SOURCE.normal,
          )}
          onClick={() => {
            AnalyticsUtil.logEvent(
              "SIGNPOSTING_MODAL_CREATE_DATASOURCE_CLICK",
              {
                from: "CHECKLIST",
              },
            );
            dispatch(showSignpostingModal(false));

            history.push(
              integrationEditorURL({
                basePageId,
                selectedTab: INTEGRATION_TABS.NEW,
              }),
            );
          }}
          step={SIGNPOSTING_STEP.CONNECT_A_DATASOURCE}
          testid={"checklist-datasource"}
        />
        <CheckListItem
          boldText={createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.bold)}
          completed={!!actions.length}
          disabled={!datasources.length && !actions.length}
          docLink="https://docs.appsmith.com/core-concepts/data-access-and-binding/querying-a-database"
          normalText={createMessage(ONBOARDING_CHECKLIST_CREATE_A_QUERY.normal)}
          onClick={() => {
            AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_CREATE_QUERY_CLICK", {
              from: "CHECKLIST",
            });
            dispatch(showSignpostingModal(false));
            history.push(
              integrationEditorURL({
                basePageId,
                selectedTab: INTEGRATION_TABS.ACTIVE,
              }),
            );
            // Event for datasource creation click
            const entryPoint = DatasourceCreateEntryPoints.NEW_APP_CHECKLIST;

            AnalyticsUtil.logEvent("NAVIGATE_TO_CREATE_NEW_DATASOURCE_PAGE", {
              entryPoint,
            });
          }}
          step={SIGNPOSTING_STEP.CREATE_A_QUERY}
          testid={"checklist-action"}
        />
        <CheckListItem
          boldText={createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.bold)}
          completed={Object.keys(widgets).length > 1}
          disabled={false}
          docLink="https://docs.appsmith.com/reference/widgets"
          normalText={createMessage(ONBOARDING_CHECKLIST_ADD_WIDGETS.normal)}
          onClick={() => {
            AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_ADD_WIDGET_CLICK", {
              from: "CHECKLIST",
            });
            dispatch(showSignpostingModal(false));
            dispatch(toggleInOnboardingWidgetSelection(true));
            dispatch(forceOpenWidgetPanel(true));
            history.push(builderURL({ basePageId }));
          }}
          step={SIGNPOSTING_STEP.ADD_WIDGETS}
          testid={"checklist-widget"}
        />
        <CheckListItem
          boldText={createMessage(
            ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.bold,
          )}
          completed={isConnectionPresent}
          disabled={Object.keys(widgets).length === 1 || !actions.length}
          docLink="https://docs.appsmith.com/core-concepts/data-access-and-binding/displaying-data-read"
          normalText={createMessage(
            ONBOARDING_CHECKLIST_CONNECT_DATA_TO_WIDGET.normal,
          )}
          onClick={onconnectYourWidget}
          step={SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET}
          testid={"checklist-connection"}
        />
        <CheckListItem
          boldText={createMessage(
            ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.bold,
          )}
          completed={isDeployed}
          disabled={false}
          normalText={createMessage(
            ONBOARDING_CHECKLIST_DEPLOY_APPLICATIONS.normal,
          )}
          onClick={() => {
            AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_PUBLISH_CLICK", {
              from: "CHECKLIST",
            });
            dispatch(showSignpostingModal(false));
            dispatch({
              type: ReduxActionTypes.PUBLISH_APPLICATION_INIT,
              payload: {
                applicationId,
              },
            });
          }}
          step={SIGNPOSTING_STEP.DEPLOY_APPLICATIONS}
          testid={"checklist-deploy"}
        />
      </div>
    </>
  );
}

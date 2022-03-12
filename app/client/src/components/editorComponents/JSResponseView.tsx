import React, {
  useEffect,
  useRef,
  RefObject,
  useCallback,
  useState,
} from "react";
import { connect, useDispatch } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { JSEditorRouteParams } from "constants/routes";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  EXECUTING_FUNCTION,
  PARSING_ERROR,
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_JS_RESPONSE_LAST_HALF,
  JS_SHORTCUT_FIRST_HALF,
  JS_SHORTCUT_LAST_HALF,
} from "@appsmith/constants/messages";
import { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs, {
  ListWrapper as DebuggerErrorList,
} from "./Debugger/DebuggerLogs";
import ErrorLogs from "./Debugger/Errors";
import Resizer, { ResizerCSS } from "./Debugger/Resizer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { JSCollection, JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { startExecutingJSFunction } from "actions/jsPaneActions";
import Text, { TextType } from "components/ads/Text";
import { Classes } from "components/ads/common";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import { EvaluationError } from "utils/DynamicBindingUtils";
import { DebugButton } from "./Debugger/DebugCTA";
import { setCurrentTab } from "actions/debuggerActions";
import { DEBUGGER_TAB_KEYS } from "./Debugger/helpers";
import EntityBottomTabs from "./EntityBottomTabs";
import Icon from "components/ads/Icon";
import { ReactComponent as FunctionSettings } from "assets/icons/menu/settings.svg";
import JSFunctionSettings from "pages/Editor/JSEditor/JSFunctionSettings";
import FlagBadge from "components/utils/FlagBadge";
import { TAB_MIN_HEIGHT } from "components/ads/Tabs";
import { theme } from "constants/DefaultTheme";
import { Button, Size, IconSize } from "components/ads";
import { isMac } from "utils/helpers";

const ResponseContainer = styled.div`
  ${ResizerCSS}
  width: 100%;
  // Minimum height of bottom tabs as it can be resized
  min-height: ${({ theme }) => theme.smallHeaderHeight};
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};

  .react-tabs__tab-panel {
    overflow-y: auto;
    height: ${({ theme }) => `calc(100% - ${theme.smallHeaderHeight})`};
  }
  ${DebuggerErrorList} {
    height: ${() => `calc(100% - 50px)`};
  }
  .CodeEditorTarget {
    pointer-events: none;
  }
`;

const ResponseTabWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  &.disable * {
    opacity: 0.8;
    pointer-events: none;
  }
  .response-run {
    margin: 0 10px;
  }
`;

const ResponseTabActionsList = styled.ul`
  height: 100%;
  width: 20%;
  list-style: none;
  padding-left: 0;
  ${thinScrollbar};
  scrollbar-width: thin;
  overflow: auto;
  padding-bottom: 40px;
  margin-top: 0;
`;

const ResponseTabAction = styled.li`
  padding: 10px 0px 10px 20px;
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
    background-color: #f0f0f0;
  }
  .function-name {
    margin-left: 5px;
    display: inline-block;
    flex: 1;
  }
  .function-actions {
    margin-left: auto;
    order: 2;
    svg {
      display: inline-block;
    }
  }
  .run-button {
    margin: 0 15px;
    margin-left: 10px;
  }
  &.active {
    background-color: #f0f0f0;
  }
`;

const TabbedViewWrapper = styled.div`
  height: 100%;

  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
    }
  }
`;

const ResponseViewer = styled.div`
  width: 100%;
`;

const NoResponseContainer = styled.div`
  height: 100%;
  width: max-content;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  margin: 0 auto;
  &.empty {
    background-color: #fafafa;
  }
  .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: auto;
      height: 150px;
      position: relative;
      top: 24px;
      left: -90px;
      z-index: -1;
    }
  }
  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
    color: #090707;
  }
`;
const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

const FailedMessage = styled.div`
  display: flex;
  align-items: center;
  margin-left: 5px;
`;

const StyledCallout = styled(Callout)`
  .${Classes.TEXT} {
    line-height: normal;
  }
`;
const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 4px;
`;

const HighlightedText = styled.span`
  color: #191919;
  background: #ebebeb;
  margin: 0 6px;
  padding: 2px;
  font-weight: 600;
`;

const NoResponseCTAWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  button {
    height: 30px;
  }
`;

enum JSResponseState {
  IsExecuting = "IsExecuting",
  IsDirty = "IsDirty",
  NoResponse = "NoResponse",
  ShowResponse = "ShowResponse",
}

interface ReduxStateProps {
  responses: Record<string, any>;
  isExecuting: Record<string, boolean>;
}

type Props = ReduxStateProps &
  RouteComponentProps<JSEditorRouteParams> & {
    currentFunction: JSAction | null;
    showResponse: boolean;
    theme?: EditorTheme;
    jsObject: JSCollection;
    errors: Array<EvaluationError>;
    children: React.ReactNode;
    disabled: boolean;
    isLoading: boolean;
    onButtonClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  };

function getShortcut() {
  return (
    <HighlightedText>
      {isMac() ? `CMD + ENTER` : `CTRL + ENTER`}
    </HighlightedText>
  );
}
function JSResponseView(props: Props) {
  const {
    children,
    currentFunction,
    disabled,
    errors,
    isExecuting,
    isLoading,
    jsObject,
    onButtonClick,
    responses,
    showResponse,
  } = props;
  const [responseStatus, setResponseStatus] = useState<JSResponseState>(
    JSResponseState.NoResponse,
  );
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const dispatch = useDispatch();
  const response =
    currentFunction && currentFunction.id && currentFunction.id in responses
      ? responses[currentFunction.id]
      : "";

  const onDebugClick = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
      source: "JS_OBJECT",
    });
    dispatch(setCurrentTab(DEBUGGER_TAB_KEYS.ERROR_TAB));
  }, []);

  useEffect(() => {
    if (
      !currentFunction ||
      !showResponse ||
      !responses.hasOwnProperty(currentFunction.id)
    ) {
      responseStatus !== JSResponseState.NoResponse &&
        setResponseStatus(JSResponseState.NoResponse);
    } else if (isExecuting[currentFunction.id]) {
      responseStatus !== JSResponseState.IsExecuting &&
        setResponseStatus(JSResponseState.IsExecuting);
    } else {
      responseStatus !== JSResponseState.ShowResponse &&
        setResponseStatus(JSResponseState.ShowResponse);
    }
  }, [currentFunction, showResponse, responses, isExecuting]);

  const tabs = [
    {
      key: "body",
      title: "Response",
      panelComponent: (
        <>
          {errors.length > 0 && (
            <HelpSection>
              <StyledCallout
                fill
                label={
                  <FailedMessage>
                    <DebugButton onClick={onDebugClick} />
                  </FailedMessage>
                }
                text={createMessage(PARSING_ERROR)}
                variant={Variant.danger}
              />
            </HelpSection>
          )}
          <ResponseTabWrapper className={errors.length ? "disable" : ""}>
            <ResponseViewer>
              {(() => {
                switch (responseStatus) {
                  case JSResponseState.NoResponse:
                    return (
                      <NoResponseContainer className="No">
                        <NoResponseCTAWrapper>
                          {children}
                          <Icon name="no-js-response" size={IconSize.MEDIUM} />
                        </NoResponseCTAWrapper>
                        <Text type={TextType.P1}>
                          {EMPTY_RESPONSE_FIRST_HALF()}
                          <InlineButton
                            disabled={disabled}
                            isLoading={isLoading}
                            onClick={onButtonClick}
                            size={Size.medium}
                            tag="button"
                            text="Run"
                            type="button"
                          />
                          {EMPTY_JS_RESPONSE_LAST_HALF()}
                        </Text>
                        <Text type={TextType.P1}>
                          {JS_SHORTCUT_FIRST_HALF()} {getShortcut()}
                          {JS_SHORTCUT_LAST_HALF()}
                        </Text>
                      </NoResponseContainer>
                    );
                  case JSResponseState.IsExecuting:
                    return (
                      <LoadingOverlayScreen theme={props.theme}>
                        {createMessage(EXECUTING_FUNCTION)}
                      </LoadingOverlayScreen>
                    );
                  case JSResponseState.ShowResponse:
                    return (
                      <ReadOnlyEditor
                        folding
                        height={"100%"}
                        input={{
                          value: response,
                        }}
                      />
                    );
                }
              })()}
            </ResponseViewer>
          </ResponseTabWrapper>
        </>
      ),
    },
    {
      key: DEBUGGER_TAB_KEYS.ERROR_TAB,
      title: createMessage(DEBUGGER_ERRORS),
      panelComponent: <ErrorLogs />,
    },
    {
      key: DEBUGGER_TAB_KEYS.LOGS_TAB,
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={jsObject?.name} />,
    },
  ];

  const runAction = (action: JSAction) => {
    setSelectActionId(action.id);
    const collectionId = getJSCollectionIdFromURL();
    dispatch(
      startExecutingJSFunction({
        collectionName: jsObject?.name || "",
        action: action,
        collectionId: collectionId || "",
      }),
    );
  };

  return (
    <ResponseContainer ref={panelRef}>
      <Resizer panelRef={panelRef} />
      <TabbedViewWrapper>
        <EntityBottomTabs
          containerRef={panelRef}
          defaultIndex={0}
          expandByDefault
          expandedHeight={theme.actionsBottomTabInitialHeight}
          tabs={tabs}
        />
      </TabbedViewWrapper>
    </ResponseContainer>
  );
}

const mapStateToProps = (
  state: AppState,
  props: { jsObject: JSCollection },
) => {
  const jsActions = state.entities.jsActions;
  const { jsObject } = props;
  const seletedJsObject =
    jsObject &&
    jsActions.find(
      (action: JSCollectionData) => action.config.id === jsObject.id,
    );
  const responses = (seletedJsObject && seletedJsObject.data) || {};
  const isExecuting = (seletedJsObject && seletedJsObject.isExecuting) || {};
  return {
    responses: responses,
    isExecuting: isExecuting,
  };
};

export default connect(mapStateToProps)(withRouter(JSResponseView));

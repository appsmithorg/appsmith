import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  DEBUGGER_RESPONSE,
  DEBUGGER_STATE,
  EXECUTING_FUNCTION,
  NO_JS_FUNCTION_RETURN_VALUE,
  UPDATING_JS_COLLECTION,
} from "ee/constants/messages";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import DebuggerLogs from "./Debugger/DebuggerLogs";
import type { JSAction } from "entities/JSCollection";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";
import { Flex, Text } from "@appsmith/ads";
import LoadingOverlayScreen from "components/editorComponents/LoadingOverlayScreen";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { DEBUGGER_TAB_KEYS } from "./Debugger/constants";
import type { BottomTab } from "./EntityBottomTabs";
import EntityBottomTabs from "./EntityBottomTabs";
import { getIsSavingEntity } from "selectors/editorSelectors";
import { getJSResponseViewState, JSResponseState } from "./utils";
import { NoResponse } from "PluginActionEditor/components/PluginActionResponse/components/NoResponse";
import {
  ResponseErrorContainer,
  ResponseErrorContent,
} from "PluginActionEditor/components/PluginActionResponse/components/Response";
import { getJsPaneDebuggerState } from "selectors/jsPaneSelectors";
import { setJsPaneDebuggerState } from "actions/jsPaneActions";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import ErrorLogs from "./Debugger/Errors";
import { isBrowserExecutionAllowed } from "ee/utils/actionExecutionUtils";
import JSRemoteExecutionView from "ee/components/JSRemoteExecutionView";
import { IDEBottomView, ViewHideBehaviour } from "IDE";
import { StateInspector } from "./Debugger/StateInspector";
import { getErrorCount } from "selectors/debuggerSelectors";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";
import { useLocation } from "react-router";

const ResponseTabWrapper = styled.div`
  display: flex;
  width: 100%;
  height: 100%;

  &.disable * {
    opacity: 0.8;
    pointer-events: none;
  }

  .response-run {
    margin: 0 10px;
  }
`;

const NoReturnValueWrapper = styled.div`
  padding-left: ${(props) => props.theme.spaces[12]}px;
  padding-top: ${(props) => props.theme.spaces[6]}px;
`;

interface Props {
  currentFunction: JSAction | null;
  theme?: EditorTheme;
  errors: Array<EvaluationError>;
  disabled: boolean;
  isLoading: boolean;
  onButtonClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  jsCollectionData: JSCollectionData | undefined;
  debuggerLogsDefaultName?: string;
}

function JSResponseView(props: Props) {
  const {
    currentFunction,
    disabled,
    errors,
    isLoading,
    jsCollectionData,
    onButtonClick,
    theme,
  } = props;
  const [responseStatus, setResponseStatus] = useState<JSResponseState>(
    JSResponseState.NoResponse,
  );
  const errorCount = useSelector(getErrorCount);

  const { isDirty, isExecuting, responses } = useMemo(() => {
    return {
      responses: (jsCollectionData && jsCollectionData.data) || {},
      isDirty: (jsCollectionData && jsCollectionData.isDirty) || {},
      isExecuting: (jsCollectionData && jsCollectionData.isExecuting) || {},
    };
  }, [jsCollectionData]);

  const dispatch = useDispatch();

  const response = useMemo(() => {
    if (
      !currentFunction ||
      !currentFunction.id ||
      !(currentFunction.id in responses)
    ) {
      return { value: "" };
    }

    return { value: responses[currentFunction.id] as string };
  }, [currentFunction, responses]);

  // parse error found while trying to execute function
  const hasExecutionParseErrors = responseStatus === JSResponseState.IsDirty;
  // error found while trying to parse JS Object
  const isSaving = useSelector(getIsSavingEntity);

  useEffect(() => {
    setResponseStatus(
      getJSResponseViewState(
        currentFunction,
        isDirty,
        isExecuting,
        isSaving,
        responses,
      ),
    );
  }, [responses, isExecuting, currentFunction, isSaving, isDirty]);

  const localExecutionAllowed = useMemo(() => {
    return isBrowserExecutionAllowed(
      jsCollectionData?.config,
      currentFunction || undefined,
    );
  }, [jsCollectionData?.config, currentFunction]);

  const JSResponseTab = useMemo(() => {
    return (
      <>
        {localExecutionAllowed && hasExecutionParseErrors && (
          <ResponseErrorContainer>
            <ResponseErrorContent>
              <div className="t--js-response-parse-error-call-out">
                Function failed to execute. Check logs for more information.
              </div>
            </ResponseErrorContent>
          </ResponseErrorContainer>
        )}
        <ResponseTabWrapper
          className={errors.length && localExecutionAllowed ? "disable" : ""}
        >
          <Flex px="spaces-7" width="100%">
            <>
              {localExecutionAllowed && (
                <>
                  {responseStatus === JSResponseState.NoResponse && (
                    <NoResponse
                      isRunDisabled={disabled}
                      isRunning={isLoading}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      onRunClick={onButtonClick}
                    />
                  )}
                  {responseStatus === JSResponseState.IsExecuting && (
                    <LoadingOverlayScreen theme={theme}>
                      {createMessage(EXECUTING_FUNCTION)}
                    </LoadingOverlayScreen>
                  )}
                  {responseStatus === JSResponseState.NoReturnValue && (
                    <NoReturnValueWrapper>
                      <Text kind="body-m">
                        {createMessage(
                          NO_JS_FUNCTION_RETURN_VALUE,
                          currentFunction?.name,
                        )}
                      </Text>
                    </NoReturnValueWrapper>
                  )}
                  {responseStatus === JSResponseState.ShowResponse && (
                    <ReadOnlyEditor folding height="100%" input={response} />
                  )}
                </>
              )}
              {!localExecutionAllowed && (
                <JSRemoteExecutionView collectionData={jsCollectionData} />
              )}
              {responseStatus === JSResponseState.IsUpdating && (
                <LoadingOverlayScreen theme={theme}>
                  {createMessage(UPDATING_JS_COLLECTION)}
                </LoadingOverlayScreen>
              )}
            </>
          </Flex>
        </ResponseTabWrapper>
      </>
    );
  }, [
    currentFunction?.name,
    disabled,
    errors.length,
    hasExecutionParseErrors,
    isLoading,
    jsCollectionData,
    localExecutionAllowed,
    onButtonClick,
    theme,
    response,
    responseStatus,
  ]);

  const ideViewMode = useSelector(getIDEViewMode);
  const location = useLocation();

  const ideType = getIDETypeByUrl(location.pathname);

  const tabs = useMemo(() => {
    const jsTabs: BottomTab[] = [
      {
        key: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        title: createMessage(DEBUGGER_RESPONSE),
        panelComponent: JSResponseTab,
      },
      {
        key: DEBUGGER_TAB_KEYS.LOGS_TAB,
        title: createMessage(DEBUGGER_LOGS),
        panelComponent: <DebuggerLogs />,
      },
    ];

    if (ideViewMode === EditorViewMode.FullScreen) {
      jsTabs.push({
        key: DEBUGGER_TAB_KEYS.ERROR_TAB,
        title: createMessage(DEBUGGER_ERRORS),
        count: errorCount,
        panelComponent: <ErrorLogs />,
      });

      if (ideType === IDE_TYPE.App) {
        jsTabs.push({
          key: DEBUGGER_TAB_KEYS.STATE_TAB,
          title: createMessage(DEBUGGER_STATE),
          panelComponent: <StateInspector />,
        });
      }
    }

    return jsTabs;
  }, [JSResponseTab, errorCount, ideType, ideViewMode]);

  // get the selected tab from the store.
  const { open, responseTabHeight, selectedTab } = useSelector(
    getJsPaneDebuggerState,
  );

  // set the selected tab in the store.
  const setSelectedResponseTab = useCallback(
    (selectedTab: string) => {
      dispatch(setJsPaneDebuggerState({ open: true, selectedTab }));
    },
    [dispatch],
  );
  // set the height of the response pane on resize.
  const setResponseHeight = useCallback(
    (height: number) => {
      dispatch(setJsPaneDebuggerState({ responseTabHeight: height }));
    },
    [dispatch],
  );

  // close the debugger
  const onToggle = useCallback(
    () => dispatch(setJsPaneDebuggerState({ open: !open })),
    [dispatch, open],
  );

  // Do not render if header tab is selected in the bottom bar.
  return (
    <IDEBottomView
      behaviour={ViewHideBehaviour.COLLAPSE}
      className="t--js-editor-bottom-pane-container"
      height={responseTabHeight}
      hidden={!open}
      onHideClick={onToggle}
      setHeight={setResponseHeight}
    >
      <EntityBottomTabs
        isCollapsed={!open}
        onSelect={setSelectedResponseTab}
        selectedTabKey={selectedTab || ""}
        tabs={tabs}
      />
    </IDEBottomView>
  );
}

export default JSResponseView;

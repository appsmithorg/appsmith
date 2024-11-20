import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactJson from "react-json-view";
import {
  apiReactJsonProps,
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
  ResponseTabErrorDefaultMessage,
} from "../ApiResponse";
import { ResponseFormatTabs } from "../ResponseFormatTabs";
import { NoResponse } from "../NoResponse";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { JsonWrapper } from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import {
  Callout,
  Menu,
  MenuContent,
  MenuGroup,
  MenuGroupName,
  MenuItem,
  MenuTrigger,
  Text,
  Tooltip,
  type CalloutLinkProps,
} from "@appsmith/ads";

import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Action } from "entities/Action";
import { getActionData } from "ee/selectors/entitiesSelector";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import { isString } from "lodash";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import BindDataButton from "../BindDataButton";
import {
  getPluginActionDebuggerState,
  openPluginActionSettings,
  setPluginActionEditorSelectedTab,
} from "../../../../store";
import {
  createMessage,
  PREPARED_STATEMENT_WARNING,
} from "ee/constants/messages";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

import * as Styled from "./styles";
import { useBoolean, useEventCallback } from "usehooks-ts";
import { RESPONSE_TABLE_HEIGHT_OFFSET } from "./constants";
import { scrollbarWidth } from "utils/helpers";

interface Props {
  actionSource: SourceEntity;
  isRunDisabled?: boolean;
  isRunning: boolean;
  onRunClick: () => void;
  currentActionConfig: Action;
  runErrorMessage?: string;
  actionName: string;
}

export const QueryResponseTab = (props: Props) => {
  const {
    actionName,
    actionSource,
    currentActionConfig,
    isRunDisabled = false,
    isRunning,
    onRunClick,
    runErrorMessage,
  } = props;

  const dispatch = useDispatch();
  const { toggle: toggleContentTypeMenuOpen, value: isContentTypeMenuOpen } =
    useBoolean(false);

  const {
    setFalse: setIsNotHovered,
    setTrue: setIsHovered,
    value: isDataContainerHovered,
  } = useBoolean(false);

  const isContentTypeSelectorVisible =
    isDataContainerHovered || isContentTypeMenuOpen;

  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const actionResponse = useSelector((state) =>
    getActionData(state, currentActionConfig.id),
  );
  const { responseTabHeight } = useSelector(getPluginActionDebuggerState);

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  const scrollbarOffset = scrollbarWidth();

  let output: Record<string, unknown>[] | string = "";
  let errorMessage = runErrorMessage;
  let hintMessages: Array<string> = [];
  let showPreparedStatementWarning = false;

  // Query is executed even once during the session, show the response data.
  if (actionResponse) {
    if (!actionResponse.isExecutionSuccess) {
      // Pass the error to be shown in the error tab
      errorMessage = actionResponse.readableError
        ? getErrorAsString(actionResponse.readableError)
        : getErrorAsString(actionResponse.body);
    } else if (isString(actionResponse.body)) {
      //reset error.
      errorMessage = "";
      try {
        // Try to parse response as JSON array to be displayed in the Response tab
        output = JSON.parse(actionResponse.body);
      } catch (e) {
        // In case the string is not a JSON, wrap it in a response object
        output = [
          {
            response: actionResponse.body,
          },
        ];
      }
    } else {
      //reset error.
      errorMessage = "";
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output = actionResponse.body as any;
    }

    if (actionResponse.messages && actionResponse.messages.length) {
      //reset error.
      errorMessage = "";
      hintMessages = actionResponse.messages;
    }

    const { actionConfiguration } = currentActionConfig;
    const hasPluginSpecifiedTemplates =
      actionConfiguration?.pluginSpecifiedTemplates?.[0]?.value === true;
    // oracle have different key for prepared statements
    const hasPreparedStatement =
      actionConfiguration?.formData?.preparedStatement?.data === true;

    if (errorMessage && (hasPluginSpecifiedTemplates || hasPreparedStatement)) {
      showPreparedStatementWarning = true;
    }
  }

  const recordCount = output?.length ?? 1;

  const responseBodyTabs =
    responseDataTypes &&
    responseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: (
          <ResponseFormatTabs
            data={output}
            responseType={dataType.key}
            tableBodyHeight={responseTabHeight}
          />
        ),
      };
    });

  const contentTypeOptions =
    responseBodyTabs &&
    responseBodyTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const [firstContentTypeOption] = contentTypeOptions;
  const [selectedContentType, setSelectedContentType] = useState(
    firstContentTypeOption?.value,
  );

  const currentContentType =
    selectedContentType || firstContentTypeOption?.value;

  const responseState =
    actionResponse && getUpdateTimestamp(actionResponse.request);

  const selectedTabIndex =
    responseDataTypes &&
    responseDataTypes.findIndex(
      (dataType) => dataType.title === responseDisplayFormat?.title,
    );

  const onResponseTabSelect = (tabKey: string) => {
    if (tabKey === DEBUGGER_TAB_KEYS.ERROR_TAB) {
      AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
        source: "QUERY_PANE",
      });
    }

    dispatch(
      setActionResponseDisplayFormat({
        id: currentActionConfig?.id || "",
        field: "responseDisplayFormat",
        value: tabKey,
      }),
    );
  };

  const handleRunClick = useEventCallback(() => {
    onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  });

  const navigateToSettings = useCallback(() => {
    if (isActionRedesignEnabled) {
      dispatch(openPluginActionSettings(true));
    } else {
      dispatch(setPluginActionEditorSelectedTab(EDITOR_TABS.SETTINGS));
    }
  }, [dispatch, isActionRedesignEnabled]);

  const preparedStatementCalloutLinks: CalloutLinkProps[] = useMemo(
    () => [
      {
        onClick: navigateToSettings,
        children: createMessage(PREPARED_STATEMENT_WARNING.LINK),
      },
    ],
    [navigateToSettings],
  );

  const queryTooltipContent = useMemo(() => {
    if (actionResponse) {
      const messages = [
        [
          "duration",
          "Time to run",
          `${(Number(actionResponse.duration) / 1000).toFixed(1)}s`,
        ],
      ];

      if (actionResponse.size) {
        messages.push([
          "size",
          "Response size",
          `${(Number(actionResponse.size) / 1000).toFixed(1)}kb`,
        ]);
      }

      return (
        <>
          {messages.map(([key, title, message]) => (
            <div key={key}>{`${title}: ${message}`}</div>
          ))}
        </>
      );
    }

    return null;
  }, [actionResponse]);

  const handleContentTypeChange = useEventCallback((e?: Event) => {
    if (e?.target && e.target instanceof HTMLElement) {
      const { value } = e.target.dataset;

      if (typeof value === "string") {
        setSelectedContentType(value);
        onResponseTabSelect(value);
      }
    }
  });

  const handleJsonWrapperClick = useEventCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
  );

  if (isRunning) {
    return (
      <Styled.LoadingContainer>
        <ActionExecutionInProgressView
          actionType="query"
          theme={EditorTheme.LIGHT}
        />
      </Styled.LoadingContainer>
    );
  }

  if (!output && !errorMessage) {
    return (
      <NoResponse
        isRunDisabled={isRunDisabled}
        isRunning={isRunning}
        onRunClick={handleRunClick}
      />
    );
  }

  return (
    <Styled.Root>
      {showPreparedStatementWarning && (
        <Callout
          data-testid="t--prepared-statement-warning"
          kind="warning"
          links={preparedStatementCalloutLinks}
        >
          {createMessage(PREPARED_STATEMENT_WARNING.MESSAGE)}
        </Callout>
      )}
      {errorMessage && (
        <div>
          <Styled.StatusBar>
            <Styled.StatusBarInfo>
              <Styled.StatusBarText $isBold kind="code">
                {`${actionName}.run():`}
              </Styled.StatusBarText>
              <Styled.StatusBarText $isError kind="code">
                Error
              </Styled.StatusBarText>
            </Styled.StatusBarInfo>
          </Styled.StatusBar>
          <ResponseTabErrorContainer>
            <ResponseTabErrorContent>
              <ResponseTabErrorDefaultMessage>
                Your query failed to execute
                {actionResponse &&
                  (actionResponse.pluginErrorDetails || actionResponse.body) &&
                  ":"}
              </ResponseTabErrorDefaultMessage>
              {actionResponse &&
                (actionResponse.pluginErrorDetails ? (
                  <>
                    <div data-testid="t--query-error">
                      {actionResponse.pluginErrorDetails
                        .downstreamErrorMessage ||
                        actionResponse.pluginErrorDetails.appsmithErrorMessage}
                    </div>
                    {actionResponse.pluginErrorDetails.downstreamErrorCode && (
                      <LogAdditionalInfo
                        text={
                          actionResponse.pluginErrorDetails.downstreamErrorCode
                        }
                      />
                    )}
                  </>
                ) : (
                  actionResponse.body && (
                    <div data-testid="t--query-error">
                      {actionResponse.body}
                    </div>
                  )
                ))}
              <LogHelper
                logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
                name="PluginExecutionError"
                pluginErrorDetails={
                  actionResponse && actionResponse.pluginErrorDetails
                }
                source={actionSource}
              />
            </ResponseTabErrorContent>
            {actionResponse && actionResponse.request && (
              <JsonWrapper
                className="t--debugger-log-state"
                onClick={handleJsonWrapperClick}
              >
                <ReactJson src={responseState} {...apiReactJsonProps} />
              </JsonWrapper>
            )}
          </ResponseTabErrorContainer>
        </div>
      )}
      {hintMessages && hintMessages.length > 0 && (
        <Styled.HelpSection>
          {hintMessages.map((msg, index) => (
            <Callout key={index} kind="warning">
              {msg}
            </Callout>
          ))}
        </Styled.HelpSection>
      )}

      {currentActionConfig &&
        output &&
        responseBodyTabs &&
        responseBodyTabs.length > 0 &&
        selectedTabIndex !== -1 && (
          <Styled.DataContainer
            $height={responseTabHeight}
            data-testid="t--query-response-data-container"
            onMouseEnter={setIsHovered}
            onMouseLeave={setIsNotHovered}
          >
            <Styled.StatusBar>
              <Tooltip
                content={queryTooltipContent}
                isDisabled={!queryTooltipContent}
                placement="bottom"
              >
                <Styled.StatusBarInfo>
                  <Styled.StatusBarText $hasTooltip $isBold kind="code">
                    {`${actionName}.run():`}
                  </Styled.StatusBarText>
                  <Styled.StatusBarText
                    $hasTooltip
                    data-testid="t--query-response-record-count"
                    kind="code"
                  >{`${recordCount} record${recordCount > 1 ? "s" : ""}`}</Styled.StatusBarText>
                </Styled.StatusBarInfo>
              </Tooltip>
              <BindDataButton
                actionName={actionName || currentActionConfig.name}
                hasResponse={!!actionResponse}
                suggestedWidgets={actionResponse?.suggestedWidgets}
              />
            </Styled.StatusBar>

            <Styled.Response>
              <ResponseFormatTabs
                data={output}
                responseType={currentContentType}
                tableBodyHeight={
                  responseTabHeight +
                  RESPONSE_TABLE_HEIGHT_OFFSET -
                  scrollbarOffset
                }
              />
            </Styled.Response>
            <Menu onOpenChange={toggleContentTypeMenuOpen}>
              <MenuTrigger>
                <Styled.Fab
                  $isVisible={isContentTypeSelectorVisible}
                  aria-label={`Change response format. Current format: ${currentContentType}`}
                  data-testid="t--query-response-type-trigger"
                  endIcon={
                    isContentTypeMenuOpen
                      ? "arrow-up-s-line"
                      : "arrow-down-s-line"
                  }
                  kind="secondary"
                  startIcon={`content-type-${currentContentType.toLocaleLowerCase()}`}
                >
                  {currentContentType}
                </Styled.Fab>
              </MenuTrigger>
              <MenuContent loop>
                <MenuGroupName asChild>
                  <Text kind="body-s">View as</Text>
                </MenuGroupName>
                <MenuGroup>
                  {contentTypeOptions.map(({ label, value }) => (
                    <MenuItem
                      data-testid="t--query-response-type-menu-item"
                      data-value={value}
                      key={value}
                      onSelect={handleContentTypeChange}
                      startIcon={`content-type-${value.toLocaleLowerCase()}`}
                    >
                      {label}
                    </MenuItem>
                  ))}
                </MenuGroup>
              </MenuContent>
            </Menu>
          </Styled.DataContainer>
        )}
    </Styled.Root>
  );
};

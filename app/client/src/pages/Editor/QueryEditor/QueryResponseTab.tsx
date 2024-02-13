import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactJson from "react-json-view";
import {
  apiReactJsonProps,
  NoResponse,
  responseTabComponent,
  ResponseTabErrorContainer,
  ResponseTabErrorContent,
  ResponseTabErrorDefaultMessage,
} from "components/editorComponents/ApiResponseView";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { JsonWrapper } from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import { Callout, Flex, SegmentedControl } from "design-system";
import styled from "styled-components";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import type { SourceEntity } from "entities/AppsmithConsole";
import type { Action } from "entities/Action";
import { getActionData } from "@appsmith/selectors/entitiesSelector";
import { actionResponseDisplayDataFormats } from "../utils";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getHasExecuteActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { getErrorAsString } from "sagas/ActionExecution/errorUtils";
import { isString } from "lodash";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import BindDataButton from "./BindDataButton";
import { getQueryPaneDebuggerState } from "selectors/queryPaneSelectors";

const HelpSection = styled.div``;

export const ResponseDataContainer = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
  padding-top: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  overflow-y: clip;
  overflow-x: scroll;
`;

const ResponseContentWrapper = styled.div<{ isError: boolean }>`
  overflow-y: clip;
  display: grid;
  height: ${(props) => (props.isError ? "" : "100%")};

  ${HelpSection} {
    margin-bottom: 10px;
  }
  position: relative;
`;

interface Props {
  actionSource: SourceEntity;
  isRunning: boolean;
  onRunClick: () => void;
  currentActionConfig: Action;
  runErrorMessage?: string;
}

const QueryResponseTab = (props: Props) => {
  const {
    actionSource,
    currentActionConfig,
    isRunning,
    onRunClick,
    runErrorMessage,
  } = props;
  const dispatch = useDispatch();

  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  const actionResponse = useSelector((state) =>
    getActionData(state, currentActionConfig.id),
  );
  const { responseTabHeight } = useSelector(getQueryPaneDebuggerState);

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  const responseBodyTabs =
    responseDataTypes &&
    responseDataTypes.map((dataType, index) => {
      return {
        index: index,
        key: dataType.key,
        title: dataType.title,
        panelComponent: responseTabComponent(
          dataType.key,
          output,
          responseTabHeight,
        ),
      };
    });

  const segmentedControlOptions =
    responseBodyTabs &&
    responseBodyTabs.map((item) => {
      return { value: item.key, label: item.title };
    });

  const [selectedControl, setSelectedControl] = useState(
    segmentedControlOptions[0]?.value,
  );

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

  const responseTabOnRunClick = () => {
    onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  };

  let error = runErrorMessage;
  let hintMessages: Array<string> = [];
  let output: Record<string, any>[] | null = null;

  // Query is executed even once during the session, show the response data.
  if (actionResponse) {
    if (!actionResponse.isExecutionSuccess) {
      // Pass the error to be shown in the error tab
      error = actionResponse.readableError
        ? getErrorAsString(actionResponse.readableError)
        : getErrorAsString(actionResponse.body);
    } else if (isString(actionResponse.body)) {
      //reset error.
      error = "";
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
      error = "";
      output = actionResponse.body as any;
    }
    if (actionResponse.messages && actionResponse.messages.length) {
      //reset error.
      error = "";
      hintMessages = actionResponse.messages;
    }
  }

  if (isRunning) {
    return (
      <ActionExecutionInProgressView
        actionType="query"
        theme={EditorTheme.LIGHT}
      />
    );
  }

  return (
    <ResponseContentWrapper isError={!!error}>
      {error && (
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
                    {actionResponse.pluginErrorDetails.downstreamErrorMessage ||
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
                  <div data-testid="t--query-error">{actionResponse.body}</div>
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
              onClick={(e) => e.stopPropagation()}
            >
              <ReactJson src={responseState} {...apiReactJsonProps} />
            </JsonWrapper>
          )}
        </ResponseTabErrorContainer>
      )}
      {hintMessages && hintMessages.length > 0 && (
        <HelpSection>
          {hintMessages.map((msg, index) => (
            <Callout key={index} kind="warning">
              {msg}
            </Callout>
          ))}
        </HelpSection>
      )}
      {currentActionConfig &&
        output &&
        responseBodyTabs &&
        responseBodyTabs.length > 0 &&
        selectedTabIndex !== -1 && (
          <ResponseDataContainer>
            <Flex justifyContent="space-between">
              <SegmentedControl
                data-testid="t--response-tab-segmented-control"
                defaultValue={segmentedControlOptions[0]?.value}
                isFullWidth={false}
                onChange={(value) => {
                  setSelectedControl(value);
                  onResponseTabSelect(value);
                }}
                options={segmentedControlOptions}
                value={selectedControl}
              />
              <BindDataButton
                actionName={currentActionConfig.name}
                hasResponse={!!actionResponse}
                suggestedWidgets={actionResponse?.suggestedWidgets}
              />
            </Flex>
            {responseTabComponent(
              selectedControl || segmentedControlOptions[0]?.value,
              output,
              responseTabHeight,
            )}
          </ResponseDataContainer>
        )}
      {!output && !error && (
        <NoResponse
          isButtonDisabled={!isExecutePermitted}
          isQueryRunning={isRunning}
          onRunClick={responseTabOnRunClick}
        />
      )}
    </ResponseContentWrapper>
  );
};

export default QueryResponseTab;

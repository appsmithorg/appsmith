import React, { useMemo } from "react";
import ReactJson from "react-json-view";
import { isEmpty, noop } from "lodash";
import styled from "styled-components";
import { Callout, Flex } from "@appsmith/ads";
import {
  JsonWrapper,
  reactJsonProps,
} from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import type { ActionResponse } from "api/ActionAPI";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import type { SourceEntity } from "entities/AppsmithConsole";
import ApiResponseMeta from "./ApiResponseMeta";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { type Action } from "entities/Action";
import { hasFailed } from "../utils";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import ApiFormatSegmentedResponse from "./ApiFormatSegmentedResponse";
import { NoResponse } from "./NoResponse";
import { useSelector } from "react-redux";
import { getFilteredErrors } from "selectors/debuggerSelectors";

const HelpSection = styled.div`
  padding-bottom: 5px;
  padding-top: 10px;
`;

const ResponseDataContainer = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;

  & .CodeEditorTarget {
    overflow: hidden;
  }
`;

export const ResponseTabErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  gap: 8px;
  height: fit-content;
  background: var(--ads-v2-color-bg-error);
  border-bottom: 1px solid var(--ads-v2-color-border);
  font-size: 12px;
  line-height: 16px;
`;

export const ResponseTabErrorContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

export const ResponseTabErrorDefaultMessage = styled.div`
  flex-shrink: 0;
`;

export function ApiResponse(props: {
  action: Action;
  actionResponse?: ActionResponse;
  isRunning: boolean;
  isRunDisabled: boolean;
  theme: EditorTheme;
  onRunClick: () => void;
  responseTabHeight: number;
}) {
  const {
    action,
    actionResponse,
    isRunDisabled,
    isRunning,
    onRunClick,
    responseTabHeight,
    theme,
  } = props;
  const { id, name } = action;

  const errors = useSelector(getFilteredErrors);

  const actionSource: SourceEntity = useMemo(
    () => ({
      type: ENTITY_TYPE.ACTION,
      name,
      id,
    }),
    [name, id],
  );

  if (!actionResponse) {
    return (
      <Flex h="100%" w="100%">
        <NoResponse
          isRunDisabled={isRunDisabled}
          isRunning={isRunning}
          onRunClick={onRunClick}
        />
      </Flex>
    );
  }

  const { body, messages, pluginErrorDetails, request } = actionResponse;

  const runHasFailed = hasFailed(actionResponse);
  const requestWithTimestamp = getUpdateTimestamp(request);

  return (
    <Flex flexDirection="column" h="100%" w="100%">
      <ApiResponseMeta actionName={name} actionResponse={actionResponse} />
      {Array.isArray(messages) && messages.length > 0 && (
        <HelpSection>
          {messages.map((message, i) => (
            <Callout key={i} kind="warning">
              {message}
            </Callout>
          ))}
        </HelpSection>
      )}
      {isRunning && (
        <ActionExecutionInProgressView actionType="API" theme={theme} />
      )}
      {runHasFailed && !isRunning ? (
        <ResponseTabErrorContainer>
          <ResponseTabErrorContent>
            <ResponseTabErrorDefaultMessage>
              Your API failed to execute
              {actionResponse && (pluginErrorDetails || body) && ":"}
            </ResponseTabErrorDefaultMessage>
            {actionResponse &&
              (pluginErrorDetails ? (
                <>
                  <div className="t--debugger-log-downstream-message">
                    {pluginErrorDetails.downstreamErrorMessage}
                  </div>
                  {pluginErrorDetails.downstreamErrorCode && (
                    <LogAdditionalInfo
                      text={pluginErrorDetails.downstreamErrorCode}
                    />
                  )}
                </>
              ) : (
                errors?.[action.id]?.messages?.[0].message.message && (
                  <div className="t--api-error">
                    {errors?.[action.id]?.messages?.[0].message.message}
                  </div>
                )
              ))}
            <LogHelper
              logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
              name="PluginExecutionError"
              pluginErrorDetails={pluginErrorDetails}
              source={actionSource}
            />
          </ResponseTabErrorContent>
          {requestWithTimestamp && (
            <JsonWrapper className="t--debugger-log-state" onClick={noop}>
              <ReactJson src={requestWithTimestamp} {...reactJsonProps} />
            </JsonWrapper>
          )}
        </ResponseTabErrorContainer>
      ) : (
        <ResponseDataContainer>
          {isEmpty(actionResponse.statusCode) ? (
            <NoResponse
              isRunDisabled={isRunDisabled}
              isRunning={isRunning}
              onRunClick={onRunClick}
            />
          ) : (
            <ApiFormatSegmentedResponse
              actionId={id}
              actionResponse={actionResponse}
              responseTabHeight={responseTabHeight}
            />
          )}
        </ResponseDataContainer>
      )}
    </Flex>
  );
}

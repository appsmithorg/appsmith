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
`;

export const ResponseTabErrorContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
`;

export const ResponseTabErrorDefaultMessage = styled.div`
  flex-shrink: 0;
`;

export const apiReactJsonProps = { ...reactJsonProps, collapsed: 0 };

export function ApiResponse(props: {
  action: Action;
  actionResponse?: ActionResponse;
  isRunning: boolean;
  isRunDisabled: boolean;
  theme: EditorTheme;
  onRunClick: () => void;
  responseTabHeight: number;
}) {
  const { id, name } = props.action;
  const actionSource: SourceEntity = useMemo(
    () => ({
      type: ENTITY_TYPE.ACTION,
      name,
      id,
    }),
    [name, id],
  );

  if (props.isRunning) {
    return (
      <Flex h="100%" w="100%">
        <ActionExecutionInProgressView actionType="API" theme={props.theme} />
      </Flex>
    );
  }

  if (!props.actionResponse) {
    return (
      <Flex h="100%" w="100%">
        <NoResponse
          isRunDisabled={props.isRunDisabled}
          isRunning={props.isRunning}
          onRunClick={props.onRunClick}
        />
      </Flex>
    );
  }

  const { messages, pluginErrorDetails, request } = props.actionResponse;

  const runHasFailed = hasFailed(props.actionResponse);
  const requestWithTimestamp = getUpdateTimestamp(request);

  return (
    <Flex flexDirection="column" h="100%" w="100%">
      <ApiResponseMeta
        actionName={name}
        actionResponse={props.actionResponse}
      />
      {Array.isArray(messages) && messages.length > 0 && (
        <HelpSection>
          {messages.map((message, i) => (
            <Callout key={i} kind="warning">
              {message}
            </Callout>
          ))}
        </HelpSection>
      )}
      {runHasFailed && !props.isRunning ? (
        <ResponseTabErrorContainer>
          <ResponseTabErrorContent>
            <ResponseTabErrorDefaultMessage>
              Your API failed to execute
              {pluginErrorDetails && ":"}
            </ResponseTabErrorDefaultMessage>
            {pluginErrorDetails && (
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
            )}
            <LogHelper
              logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
              message={pluginErrorDetails?.downstreamErrorMessage}
              name="PluginExecutionError"
              pluginErrorDetails={pluginErrorDetails}
              source={actionSource}
            />
          </ResponseTabErrorContent>
          {requestWithTimestamp && (
            <JsonWrapper className="t--debugger-log-state" onClick={noop}>
              <ReactJson src={requestWithTimestamp} {...apiReactJsonProps} />
            </JsonWrapper>
          )}
        </ResponseTabErrorContainer>
      ) : (
        <ResponseDataContainer>
          {isEmpty(props.actionResponse.statusCode) ? (
            <NoResponse
              isRunDisabled={props.isRunDisabled}
              isRunning={props.isRunning}
              onRunClick={props.onRunClick}
            />
          ) : (
            <ApiFormatSegmentedResponse
              actionId={id}
              actionResponse={props.actionResponse}
              responseTabHeight={props.responseTabHeight}
            />
          )}
        </ResponseDataContainer>
      )}
    </Flex>
  );
}

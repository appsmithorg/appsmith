import React from "react";
import ReactJson from "react-json-view";

import { JsonWrapper } from "components/editorComponents/CodeEditor/PeekOverlayPopup/JsonWrapper";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";

import { Tooltip } from "@appsmith/ads";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { PluginType, type Action } from "entities/Action";
import type { ActionResponse } from "api/ActionAPI";
import type { SourceEntity } from "entities/AppsmithConsole";

import type { API_REACT_JSON_PROPS, REACT_JSON_PROPS } from "../../constants";
import * as Styled from "../../styles";

interface ErrorViewProps {
  action: Action;
  actionResponse?: ActionResponse;
  actionSource: SourceEntity;
  reactJsonParams: typeof API_REACT_JSON_PROPS | typeof REACT_JSON_PROPS;
  tooltipContent: JSX.Element | null;
  updateTimestamp: unknown;
  handleJsonWrapperClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  action,
  actionResponse,
  actionSource,
  handleJsonWrapperClick,
  reactJsonParams,
  tooltipContent,
  updateTimestamp,
}) => {
  return (
    <div>
      <Styled.StatusBar>
        <Tooltip
          content={tooltipContent}
          id="t--response-tooltip"
          isDisabled={!tooltipContent}
          placement="bottom"
        >
          <Styled.StatusBarInfo data-testid="t--response-status-info">
            <Styled.StatusBarText
              $hasTooltip={!!tooltipContent}
              $isBold
              kind="code"
            >
              {`${action.name}.run():`}
            </Styled.StatusBarText>
            <Styled.StatusBarText
              $hasTooltip={!!tooltipContent}
              $isError
              kind="code"
            >
              Error
            </Styled.StatusBarText>
          </Styled.StatusBarInfo>
        </Tooltip>
      </Styled.StatusBar>
      <Styled.ErrorContainer>
        <Styled.ErrorContent>
          <Styled.ErrorDefaultMessage>
            Request has failed to execute
            {actionResponse &&
              (actionResponse.pluginErrorDetails || actionResponse.body) &&
              ":"}
          </Styled.ErrorDefaultMessage>
          {actionResponse &&
            (actionResponse.pluginErrorDetails ? (
              <>
                <div data-testid="t--response-error">
                  {actionResponse.pluginErrorDetails.downstreamErrorMessage ||
                    actionResponse.pluginErrorDetails.appsmithErrorMessage}
                </div>
                {actionResponse.pluginErrorDetails.downstreamErrorCode && (
                  <LogAdditionalInfo
                    text={actionResponse.pluginErrorDetails.downstreamErrorCode}
                  />
                )}
              </>
            ) : (
              actionResponse.body &&
              action.pluginType === PluginType.DB && (
                <div data-testid="t--response-error">{actionResponse.body}</div>
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
        </Styled.ErrorContent>
        {actionResponse && actionResponse.request && (
          <JsonWrapper
            className="t--debugger-log-state"
            onClick={handleJsonWrapperClick}
          >
            <ReactJson src={updateTimestamp} {...reactJsonParams} />
          </JsonWrapper>
        )}
      </Styled.ErrorContainer>
    </div>
  );
};

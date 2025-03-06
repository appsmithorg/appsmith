import React, { useMemo } from "react";
import ReactJson from "react-json-view";

import { JsonWrapper } from "components/editorComponents/Debugger/ErrorLogs/components/LogCollapseData";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";

import { Tooltip } from "@appsmith/ads";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { type Action } from "entities/Action";
import type { ActionResponse } from "api/ActionAPI";
import type { SourceEntity } from "entities/AppsmithConsole";

import { getErrorMessageFromActionResponse } from "../../utils";
import { REACT_JSON_PROPS } from "../../constants";
import * as Styled from "../../styles";

interface ErrorViewProps {
  action: Action;
  actionResponse?: ActionResponse;
  actionSource: SourceEntity;
  tooltipContent: JSX.Element | null;
  handleJsonWrapperClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  action,
  actionResponse,
  actionSource,
  handleJsonWrapperClick,
  tooltipContent,
}) => {
  const errorMessage = getErrorMessageFromActionResponse(
    actionResponse,
    action.pluginType,
  );

  const requestWithTimestamp = getUpdateTimestamp(actionResponse?.request);

  const payload = useMemo(() => {
    return {
      error: errorMessage,
      request: requestWithTimestamp,
    };
  }, [errorMessage, requestWithTimestamp]);

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
            {errorMessage && ":"}
          </Styled.ErrorDefaultMessage>
          <div data-testid="t--response-error">{errorMessage}</div>
          <LogHelper
            logType={LOG_TYPE.ACTION_EXECUTION_ERROR}
            message={`${errorMessage}`}
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
            <ReactJson src={payload} {...REACT_JSON_PROPS} />
          </JsonWrapper>
        )}
      </Styled.ErrorContainer>
    </div>
  );
};

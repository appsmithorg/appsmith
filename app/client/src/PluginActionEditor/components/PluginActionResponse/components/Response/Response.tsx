import React, { useMemo } from "react";
import ReactJson from "react-json-view";
import { useDispatch } from "react-redux";
import { useBoolean, useEventCallback } from "usehooks-ts";

import { Callout, Tooltip, type CalloutLinkProps } from "@appsmith/ads";

import type { ActionResponse } from "api/ActionAPI";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { type Action } from "entities/Action";

import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { scrollbarWidth } from "utils/helpers";

import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import {
  openPluginActionSettings,
  setPluginActionEditorSelectedTab,
} from "PluginActionEditor/store";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { JsonWrapper } from "components/editorComponents/CodeEditor/PeekOverlayPopup/JsonWrapper";
import LogAdditionalInfo from "components/editorComponents/Debugger/ErrorLogs/components/LogAdditionalInfo";
import LogHelper from "components/editorComponents/Debugger/ErrorLogs/components/LogHelper";
import { getUpdateTimestamp } from "components/editorComponents/Debugger/ErrorLogs/ErrorLogItem";
import { EDITOR_TABS } from "constants/QueryEditorConstants";
import {
  createMessage,
  PREPARED_STATEMENT_WARNING,
} from "ee/constants/messages";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { SourceEntity } from "entities/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";

import BindDataButton from "../BindDataButton";
import { NoResponse } from "../NoResponse";
import { ResponseFormatTabs } from "../ResponseFormatTabs";
import { ContentTypeSelector } from "./components";
import {
  API_REACT_JSON_PROPS,
  REACT_JSON_PROPS,
  RESPONSE_TABLE_HEIGHT_OFFSET,
} from "./constants";

import * as Styled from "./styles";
import { checkForPreparedStatement, parseActionResponse } from "./utils";

interface ResponseProps {
  action: Action;
  actionResponse?: ActionResponse;
  isRunDisabled: boolean;
  isRunning: boolean;
  onRunClick: () => void;
  responseTabHeight: number;
  theme: EditorTheme;
}

export function Response(props: ResponseProps) {
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  const {
    action,
    actionResponse,
    isRunDisabled,
    isRunning,
    onRunClick,
    responseTabHeight,
    theme,
  } = props;

  const dispatch = useDispatch();
  const scrollbarOffset = scrollbarWidth();

  const {
    setFalse: setIsNotHovered,
    setTrue: setIsHovered,
    value: isDataContainerHovered,
  } = useBoolean(false);

  const { errorMessage, hintMessages, response } =
    parseActionResponse(actionResponse);

  const recordCount = response?.length ?? 1;

  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionResponse);

  const { contentTypeOptions, currentContentType } = useMemo(() => {
    const contentTypeOptions = responseDataTypes.map(({ key, title }) => ({
      value: key,
      label: title,
    }));

    const [firstContentTypeOption] = contentTypeOptions;
    const currentContentType =
      responseDisplayFormat.value || firstContentTypeOption?.value;

    return { currentContentType, contentTypeOptions };
  }, [responseDisplayFormat, responseDataTypes]);

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

      if (actionResponse.statusCode) {
        messages.push(["statusCode", "Status", actionResponse.statusCode]);
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

  const showPreparedStatementWarning = Boolean(
    checkForPreparedStatement(action) && errorMessage,
  );

  const actionSource: SourceEntity = useMemo(
    () => ({
      type: ENTITY_TYPE.ACTION,
      name: action.name,
      id: action.id,
    }),
    [action.name, action.id],
  );

  const updateTimestamp = getUpdateTimestamp(actionResponse?.request);
  const reactJsonParams =
    action.pluginType === "API" ? API_REACT_JSON_PROPS : REACT_JSON_PROPS;

  const preparedStatementCalloutLinks: CalloutLinkProps[] = useMemo(() => {
    const navigateToSettings = () => {
      if (isActionRedesignEnabled) {
        dispatch(openPluginActionSettings(true));
      } else {
        dispatch(setPluginActionEditorSelectedTab(EDITOR_TABS.SETTINGS));
      }
    };

    return [
      {
        onClick: navigateToSettings,
        children: createMessage(PREPARED_STATEMENT_WARNING.LINK),
      },
    ];
  }, [dispatch, isActionRedesignEnabled]);

  const handleContentTypeChange = useEventCallback((e?: Event) => {
    if (e?.target && e.target instanceof HTMLElement) {
      const { value } = e.target.dataset;

      if (typeof value === "string") {
        dispatch(
          setActionResponseDisplayFormat({
            id: action?.id || "",
            field: "responseDisplayFormat",
            value,
          }),
        );
      }
    }
  });

  const handleJsonWrapperClick = useEventCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
  );

  if (isRunning) {
    return (
      <Styled.LoadingContainer>
        <ActionExecutionInProgressView actionType="query" theme={theme} />
      </Styled.LoadingContainer>
    );
  }

  if (!response && !errorMessage) {
    return (
      <NoResponse
        isRunDisabled={isRunDisabled}
        isRunning={isRunning}
        onRunClick={onRunClick}
      />
    );
  }

  return (
    <Styled.Root>
      {errorMessage && (
        <div>
          <Styled.StatusBar>
            <Styled.StatusBarInfo>
              <Styled.StatusBarText $isBold kind="code">
                {`${action.name}.run():`}
              </Styled.StatusBarText>
              <Styled.StatusBarText $isError kind="code">
                Error
              </Styled.StatusBarText>
            </Styled.StatusBarInfo>
          </Styled.StatusBar>
          <Styled.ErrorContainer>
            <Styled.ErrorContent>
              <Styled.ErrorDefaultMessage>
                Request has failed to execute
                {actionResponse &&
                  (actionResponse.pluginErrorDetails || actionResponse.body) &&
                  ":"}
              </Styled.ErrorDefaultMessage>
              {actionResponse && actionResponse.pluginErrorDetails && (
                <>
                  <div data-testid="t--error">
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
              )}
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
      )}

      {showPreparedStatementWarning && (
        <Callout
          data-testid="t--prepared-statement-warning"
          kind="warning"
          links={preparedStatementCalloutLinks}
        >
          {createMessage(PREPARED_STATEMENT_WARNING.MESSAGE)}
        </Callout>
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

      {response && (
        <Styled.DataContainer
          $height={responseTabHeight}
          data-testid="t--response-data-container"
          onMouseEnter={setIsHovered}
          onMouseLeave={setIsNotHovered}
        >
          <Styled.StatusBar>
            <Tooltip
              content={queryTooltipContent}
              id="t--response-tooltip"
              isDisabled={!queryTooltipContent}
              placement="bottom"
            >
              <Styled.StatusBarInfo data-testid="t--response-status-info">
                <Styled.StatusBarText $hasTooltip $isBold kind="code">
                  {`${action.name}.run():`}
                </Styled.StatusBarText>
                <Styled.StatusBarText
                  $hasTooltip
                  data-testid="t--response-record-count"
                  kind="code"
                >{`${recordCount} record${recordCount > 1 ? "s" : ""}`}</Styled.StatusBarText>
              </Styled.StatusBarInfo>
            </Tooltip>
            <BindDataButton
              actionName={action.name}
              hasResponse={!!actionResponse}
              suggestedWidgets={actionResponse?.suggestedWidgets}
            />
          </Styled.StatusBar>

          <Styled.Response>
            <ResponseFormatTabs
              data={response}
              responseType={currentContentType}
              tableBodyHeight={
                responseTabHeight +
                RESPONSE_TABLE_HEIGHT_OFFSET -
                scrollbarOffset
              }
            />
          </Styled.Response>
          <ContentTypeSelector
            contentTypeOptions={contentTypeOptions}
            currentContentType={currentContentType}
            handleContentTypeChange={handleContentTypeChange}
            isHovered={isDataContainerHovered}
          />
        </Styled.DataContainer>
      )}
    </Styled.Root>
  );
}

import React, { useMemo } from "react";

import { useDispatch } from "react-redux";
import { useBoolean, useEventCallback } from "usehooks-ts";
import pluralize from "pluralize";

import { Callout, Tooltip, type CalloutLinkProps } from "@appsmith/ads";

import type { ActionResponse } from "api/ActionAPI";
import ActionExecutionInProgressView from "components/editorComponents/ActionExecutionInProgressView";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { PluginType, type Action } from "entities/Action";

import { setActionResponseDisplayFormat } from "actions/pluginActionActions";
import { actionResponseDisplayDataFormats } from "pages/Editor/utils";
import { scrollbarWidth } from "utils/helpers";

import { openPluginActionSettings } from "../../../../store";
import {
  createMessage,
  PREPARED_STATEMENT_WARNING,
} from "ee/constants/messages";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { SourceEntity } from "entities/AppsmithConsole";

import BindDataButton from "../BindDataButton";
import { NoResponse } from "../NoResponse";
import { ResponseFormatTabs } from "../ResponseFormatTabs";
import { ContentTypeSelector, ErrorView } from "./components";
import { RESPONSE_TABLE_HEIGHT_OFFSET } from "./constants";

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

  const showRecordCount =
    action.pluginType === PluginType.DB ||
    actionResponse?.dataTypes?.some(({ dataType }) => dataType === "TABLE");

  const tooltipContent = useMemo(() => {
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

  const preparedStatementCalloutLinks: CalloutLinkProps[] = useMemo(() => {
    const navigateToSettings = () => {
      dispatch(openPluginActionSettings(true));
    };

    return [
      {
        onClick: navigateToSettings,
        children: createMessage(PREPARED_STATEMENT_WARNING.LINK),
      },
    ];
  }, [dispatch]);

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
        <ErrorView
          action={action}
          actionResponse={actionResponse}
          actionSource={actionSource}
          handleJsonWrapperClick={handleJsonWrapperClick}
          tooltipContent={tooltipContent}
        />
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

      {response && !!currentContentType && (
        <Styled.DataContainer
          $height={responseTabHeight}
          data-testid="t--response-data-container"
          onMouseEnter={setIsHovered}
          onMouseLeave={setIsNotHovered}
        >
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
                  {`${action.name}.run()${showRecordCount ? ":" : ""}`}
                </Styled.StatusBarText>
                {showRecordCount && (
                  <Styled.StatusBarText
                    $hasTooltip={!!tooltipContent}
                    data-testid="t--response-record-count"
                    kind="code"
                  >{`${recordCount} ${pluralize("record", recordCount)}`}</Styled.StatusBarText>
                )}
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

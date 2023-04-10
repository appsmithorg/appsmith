import React, { useState } from "react";
import type { Log, Message, SourceEntity } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import styled from "styled-components";
import { Classes, getTypographyByKey } from "design-system-old";
// import {
//   createMessage,
//   TROUBLESHOOT_ISSUE,
// } from "@appsmith/constants/messages";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { PluginErrorDetails } from "api/ActionAPI";
import LogCollapseData from "./components/LogCollapseData";
import LogAdditionalInfo from "./components/LogAdditionalInfo";
import ContextualMenu from "../ContextualMenu";
import LogEntityLink from "./components/LogEntityLink";
import LogTimeStamp from "./components/LogTimeStamp";
import { getLogIcon } from "../helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import moment from "moment";
import { Button, Icon } from "design-system";
// import { Tooltip } from "design-system";

const InnerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;
  cursor: default;
  border-bottom: 1px solid var(--ads-v2-color-border);

  &.${Severity.ERROR} {
    background-color: var(--ads-v2-color-bg-error);
  }

  &.${Severity.WARNING} {
    background-color: var(--ads-v2-color-bg-warning);
  }

  .${Classes.ICON} {
    display: inline-block;
  }

  .debugger-toggle {
    margin-right: -4px;
    ${(props) =>
      props.collapsed
        ? `transform: rotate(-90deg);`
        : `transform: rotate(0deg); `};
  }
  .debugger-time {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    font-weight: 500;
    color: var(--ads-v2-color-fg-muted);
    cursor: default;
    width: max-content;
  }

  .debugger-error-type {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    color: var(--ads-v2-color-fg);
  }

  .debugger-description {
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
    word-break: break-word;

    .debugger-label {
      ${getTypographyByKey("h6")}
      font-weight: 400;
      letter-spacing: -0.195px;
      color: var(--ads-v2-color-fg-emphasis-plus);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: normal;
      -webkit-user-select: all; /* Chrome 49+ */
      -moz-user-select: all; /* Firefox 43+ */
      -ms-user-select: all; /* No support yet */
      user-select: all; /* Likely future */
    }
    .debugger-entity {
      color: var(--ads-v2-color-fg);
      ${getTypographyByKey("h6")}
      margin-left: 6px;

      & > span {
        &:hover {
          text-decoration: underline;
          text-decoration-color: var(--ads-v2-color-fg);
        }
      }
    }
  }

  .debugger-entity-link {
    // TODO: unclear why this file and LogItem.tsx have different styles when they look so similar
    ${getTypographyByKey("h6")}
    font-weight: 400;
    letter-spacing: -0.195px;
    color: var(--ads-v2-color-fg-emphasis);
    cursor: pointer;
    text-decoration-line: underline;
    width: max-content;
  }
`;

const ContextWrapper = styled.div`
  height: 14px;
  display: flex;
  align-items: center;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const showToggleIcon = (e: Log) => {
  return !!e.state;
};

//format the requestedAt timestamp to a readable format.
const getUpdateTimestamp = (state?: Record<string, any>) => {
  if (state) {
    //clone state to avoid mutating the original state.
    const copyState = JSON.parse(JSON.stringify(state));
    copyState.requestedAt = moment(copyState.requestedAt).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    return copyState;
  }
  return state;
};

// returns required parameters for log item
export const getLogItemProps = (e: Log) => {
  return {
    icon: getLogIcon(e) as string,
    timestamp: e.timestamp,
    source: e.source,
    label: e.text,
    logData: e.logData,
    logType: e.logType,
    category: e.category,
    iconId: e.iconId,
    timeTaken: e.timeTaken ? `${e.timeTaken}ms` : "",
    severity: e.severity,
    text: e.text,
    state: getUpdateTimestamp(e.state),
    id: e.source ? e.source.id : undefined,
    messages: e.messages,
    collapsable: showToggleIcon(e),
    pluginErrorDetails: e.pluginErrorDetails,
  };
};

export type LogItemProps = {
  collapsable?: boolean;
  icon: string;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  category: LOG_CATEGORY;
  iconId?: string;
  logType?: LOG_TYPE;
  logData?: any[];
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  messages?: Message[];
  pluginErrorDetails?: PluginErrorDetails;
};

// Log item component
const ErrorLogItem = (props: LogItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const expandToggle = () => {
    //Add telemetry for expand.
    if (!isOpen) {
      AnalyticsUtil.logEvent("DEBUGGER_LOG_ITEM_EXPAND", {
        errorType: props.logType,
        errorSubType: props.messages && props.messages[0].message.name,
        appsmithErrorCode: props.pluginErrorDetails?.appsmithErrorCode,
        downstreamErrorCode: props.pluginErrorDetails?.downstreamErrorCode,
      });
    }
    setIsOpen(!isOpen);
  };

  const addHelpTelemetry = () => {
    AnalyticsUtil.logEvent("DEBUGGER_HELP_CLICK", {
      errorType: props.logType,
      errorSubType: props.messages && props.messages[0].message.name,
      appsmithErrorCode: props.pluginErrorDetails?.appsmithErrorCode,
      downstreamErrorCode: props.pluginErrorDetails?.downstreamErrorCode,
    });
  };

  const { collapsable } = props;

  return (
    <Wrapper className={props.severity} collapsed={!isOpen}>
      <InnerWrapper
        onClick={() => {
          if (collapsable) expandToggle();
        }}
      >
        <FlexWrapper
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Icon
            color={
              props.severity === Severity.ERROR
                ? "var(--ads-v2-color-fg-on-error)"
                : "inherit"
            }
            name={props.icon}
            size="md"
          />

          {props.logType &&
            props.logType !== LOG_TYPE.LINT_ERROR &&
            props.messages &&
            props.messages[0].message.name !== "SyntaxError" && (
              <LogTimeStamp
                severity={props.severity}
                timestamp={props.timestamp}
              />
            )}
          {collapsable && props.logType !== LOG_TYPE.LINT_ERROR && (
            <Button
              className={`${Classes.ICON} debugger-toggle`}
              data-cy="t--debugger-toggle"
              data-isopen={isOpen}
              isDisabled={!collapsable}
              isIconButton
              kind="tertiary"
              onClick={() => expandToggle()}
              startIcon={"expand-more"}
            />
          )}
          <div className={`debugger-error-type`}>
            {`${props.messages && props.messages[0].message.name}:`}
          </div>

          <LogEntityLink {...props} />
        </FlexWrapper>
        {!(
          props.collapsable &&
          isOpen &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
            <span
              className="debugger-label"
              data-cy="t--debugger-log-message"
              onClick={(e) => e.stopPropagation()}
            >
              {props.pluginErrorDetails
                ? props.pluginErrorDetails.title
                : props.messages && props.messages[0].message.message}
            </span>
          </div>
        )}
        {props.messages && props.messages[0].lineNumber && (
          <LogAdditionalInfo
            text={`Ln ${
              props.messages[0].lineNumber < 9
                ? "0" + (props.messages[0].lineNumber + 1)
                : props.messages[0].lineNumber + 1
            }`}
          />
        )}
        {props.category === LOG_CATEGORY.PLATFORM_GENERATED &&
          props.severity === Severity.ERROR &&
          props.logType !== LOG_TYPE.LINT_ERROR && (
            <ContextWrapper
              onClick={(e) => {
                addHelpTelemetry();
                e.stopPropagation();
              }}
            >
              <ContextualMenu
                entity={props.source}
                error={{ message: { name: "", message: "" } }}
              >
                {/* TODO: fix bug where menu component doesn't open if it's trigger is wrapped in a tooltip */}
                {/*<Tooltip content={createMessage(TROUBLESHOOT_ISSUE)}>*/}
                <Icon className={`${Classes.ICON}`} name={"help"} size="sm" />
                {/*</Tooltip>*/}
              </ContextualMenu>
            </ContextWrapper>
          )}
      </InnerWrapper>
      {collapsable && isOpen && <LogCollapseData isOpen={isOpen} {...props} />}
    </Wrapper>
  );
};

export default ErrorLogItem;

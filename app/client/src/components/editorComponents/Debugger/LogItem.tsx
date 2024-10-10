import { Collapse } from "@blueprintjs/core";
import { isString } from "lodash";
import type { Log, Message, SourceEntity } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import type { PropsWithChildren } from "react";
import React, { useState } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import EntityLink from "./EntityLink";
import { getLogIcon } from "./helpers";
import { Classes, getTypographyByKey } from "@appsmith/ads-old";
import ContextualMenu from "./ContextualMenu";
import { Button, Icon } from "@appsmith/ads";
import moment from "moment";
import classNames from "classnames";
import { DebuggerLinkUI } from "components/editorComponents/Debugger/DebuggerEntityLink";

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;

  &.${Severity.INFO} {
    border-bottom: 1px solid var(--ads-v2-color-border);
  }

  &.${Severity.ERROR} {
    background-color: var(--ads-v2-color-bg-error);
    border-bottom: 1px solid var(--ads-v2-color-border);
  }

  &.${Severity.WARNING} {
    background-color: var(--ads-v2-color-bg-warning);
    border-bottom: 1px solid var(--ads-v2-color-border);
  }

  .${Classes.ICON} {
    display: inline-block;
  }

  .debugger-toggle {
    ${(props) =>
      props.collapsed
        ? `transform: rotate(-90deg);`
        : `transform: rotate(0deg); `};
  }
  .debugger-time {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    margin-left: 4px;
    margin-right: 4px;
    color: var(--ads-v2-color-fg-muted);
    width: max-content;
  }
  .debugger-occurences {
    height: 16px;
    width: 16px;
    border-radius: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ads-v2-color-fg-emphasis);
    &.${Severity.INFO} {
      background-color: var(--ads-v2-color-bg-information);
    }
    margin-right: 4px;
    &.${Severity.ERROR} {
      background-color: var(--ads-v2-color-bg-error);
    }
    &.${Severity.WARNING} {
      background-color: var(--ads-v2-color-bg-warning);
    }
    ${getTypographyByKey("u2")}
  }
  .debugger-description {
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
    word-break: break-word;
    max-width: 60%;

    .debugger-label {
      color: var(--ads-v2-color-fg-emphasis);
      ${getTypographyByKey("p1")}
      line-height: 14px;
      font-size: 12px;
      padding-right: 4px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .debugger-entity {
      color: var(--ads-v2-color-fg-emphasis);
      ${getTypographyByKey("h6")}
      margin-left: 6px;

      & > span {
        cursor: pointer;

        &:hover {
          text-decoration: underline;
          text-decoration-color: var(--ads-v2-color-fg-emphasis);
        }
      }
    }
  }
  .debugger-timetaken {
    color: var(--ads-v2-color-fg-emphasis);
    margin-left: 5px;
    ${getTypographyByKey("p2")}
    line-height: 19px;
  }

  .debugger-entity-link {
    // TODO: unclear why this file and ErrorLogItem.tsx have different styles when they look so similar
    margin-left: auto;
    ${getTypographyByKey("btnMedium")};
    color: var(--ads-v2-color-fg-emphasis);
    cursor: pointer;
    width: max-content;
    > span {
      font-size: 12px;
    }
  }
`;

const ContextWrapper = styled.div`
  height: 14px;
  display: flex;
  align-items: center;
`;

const JsonWrapper = styled.div`
  padding: ${(props) => props.theme.spaces[1] - 1}px 0
    ${(props) => props.theme.spaces[5]}px;
  svg {
    color: var(--ads-v2-color-fg-muted) !important;
    height: 12px !important;
    width: 12px !important;
    vertical-align: baseline !important;
  }
  .object-key-val span,
  .icon-container {
    vertical-align: middle;
  }
  .brace-row {
    vertical-align: bottom;
  }
`;

type StyledCollapseProps = PropsWithChildren<{
  category: LOG_CATEGORY;
}>;

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
  margin-top: ${(props) =>
    props.isOpen && props.category === LOG_CATEGORY.USER_GENERATED
      ? " -30px"
      : " 4px"};
  margin-left: 133px;

  .debugger-message {
    ${getTypographyByKey("p2")}
    line-height: 14px;
    letter-spacing: -0.24px;
    font-size: 12px;
    color: var(--ads-v2-color-fg-emphasis);
  }

  .${Classes.ICON} {
    margin-left: 10px;
  }
`;

const MessageWrapper = styled.div`
  line-height: 14px;
`;

const showToggleIcon = (e: Log) => {
  let output = !!e.state || !!e.messages;

  if (!output && e.logData && e.logData.length > 0) {
    e.logData.forEach((item) => {
      if (typeof item === "object") {
        output = true;
      }
    });
  }

  return output;
};

export const getLogItemProps = (e: Log) => {
  return {
    icon: getLogIcon(e) as string,
    timestamp: e.timestamp,
    source: e.source,
    label: e.text,
    logData: e.logData,
    category: e.category,
    timeTaken: e.timeTaken ? `${e.timeTaken}ms` : "",
    severity: e.severity,
    text: e.text,
    state: e.state,
    id: e.source ? e.source.id : undefined,
    messages: e.messages,
    collapsible: showToggleIcon(e),
    occurences: e.occurrenceCount || 1,
  };
};

interface LogItemProps {
  collapsible?: boolean;
  icon: string;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  category: LOG_CATEGORY;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logData?: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
  messages?: Message[];
  occurences: number;
}

function LogItem(props: LogItemProps) {
  const [isOpen, setIsOpen] = useState(!!props.expand);
  const reactJsonProps = {
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontFamily: "var(--ads-v2-font-family)",
      fontSize: "11px",
      fontWeight: "400",
      letterSpacing: "-0.195px",
      lineHeight: "13px",
    },
    collapsed: 1,
  };

  const messages = props.messages || [];
  const { collapsible } = props;

  return (
    <Wrapper
      className={`${props.severity} ${collapsible ? "cursor-pointer" : ""}`}
      collapsed={!isOpen}
      onClick={() => {
        if (collapsible) setIsOpen(!isOpen);
      }}
    >
      <div className="flex items-center gap-1">
        <Icon
          color={
            props.severity === Severity.ERROR
              ? "var(--ads-v2-colors-response-error-icon-default-fg)"
              : "inherit"
          }
          name={props.icon}
          size="md"
        />
        <span className={`debugger-time ${props.severity}`}>
          {moment(parseInt(props.timestamp)).format("HH:mm:ss")}
        </span>

        <Button
          className={classNames(
            `${Classes.ICON} debugger-toggle`,
            collapsible ? "visible" : "invisible",
          )}
          isDisabled={!collapsible}
          isIconButton
          kind="tertiary"
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          startIcon={"expand-more"}
        />
        {!(
          collapsible &&
          isOpen &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
            {props.occurences > 1 && (
              <span
                className={`t--debugger-log-message-occurence debugger-occurences ${props.severity}`}
              >
                {props.occurences}
              </span>
            )}
            <span
              className="debugger-label t--debugger-log-message cursor-text"
              onClick={(e) => e.stopPropagation()}
            >
              {props.text}
            </span>

            {props.timeTaken && (
              <span className={`debugger-timetaken ${props.severity}`}>
                {props.timeTaken}
              </span>
            )}
            {props.category === LOG_CATEGORY.PLATFORM_GENERATED &&
              props.severity === Severity.ERROR && (
                <ContextWrapper onClick={(e) => e.stopPropagation()}>
                  <ContextualMenu
                    entity={props.source}
                    error={{ message: { name: "", message: "" } }}
                  >
                    <Button
                      className={`${Classes.ICON}`}
                      isIconButton
                      kind="tertiary"
                      size="sm"
                      startIcon={"question"}
                    />
                  </ContextualMenu>
                </ContextWrapper>
              )}
          </div>
        )}
        {props.source && (
          <EntityLink
            id={props.source.id}
            name={props.source.name}
            propertyPath={props.source.propertyPath}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
        )}
      </div>

      {collapsible && isOpen && (
        <StyledCollapse
          category={props.category}
          isOpen={isOpen}
          keepChildrenMounted
        >
          {messages.map((e) => {
            return (
              <MessageWrapper
                key={e.message.message}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="debugger-message t--debugger-message">
                  {isString(e.message) ? e.message : e.message.message}
                </span>
              </MessageWrapper>
            );
          })}
          {props.state && (
            <JsonWrapper
              className="t--debugger-log-state"
              onClick={(e) => e.stopPropagation()}
            >
              <ReactJson src={props.state} {...reactJsonProps} />
            </JsonWrapper>
          )}
          {props.logData &&
            props.logData.length > 0 &&
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            props.logData.map((logDatum: any) => {
              if (typeof logDatum === "object") {
                return (
                  <JsonWrapper
                    className="t--debugger-console-log-data"
                    key={Math.random()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ReactJson src={logDatum} {...reactJsonProps} />
                  </JsonWrapper>
                );
              } else {
                return (
                  <span className="debugger-label" key={Math.random()}>
                    {`${logDatum} `}
                  </span>
                );
              }
            })}
        </StyledCollapse>
      )}
    </Wrapper>
  );
}

export default React.memo(LogItem);

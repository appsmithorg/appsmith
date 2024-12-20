import React from "react";
import { Collapse } from "@blueprintjs/core";
import { isString } from "lodash";
import type { Message, SourceEntity } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import type { PropsWithChildren } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import EntityLink from "../EntityLink";
import { Classes, getTypographyByKey } from "@appsmith/ads-old";
import ContextualMenu from "../ContextualMenu";
import { Button, Flex, Icon } from "@appsmith/ads";
import moment from "moment";
import classNames from "classnames";
import { DebuggerLinkUI } from "../DebuggerEntityLink";
import { reactJsonProps } from "../ErrorLogs/components/LogCollapseData";
import { useBoolean } from "usehooks-ts";

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;
  position: relative;

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
    width: 48px;
  }

  .debugger-occurrences {
    position: absolute;
    height: 16px;
    width: 16px;
    border-radius: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ads-v2-color-fg-emphasis);
    background-color: var(--ads-v2-color-bg);

    ${getTypographyByKey("u2")}
    &.hide-on-hover {
      &:hover {
        display: none;
      }
    }
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
      ? " 0px"
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
  state?: Record<string, unknown>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
  messages?: Message[];
  occurrences: number;
}

export function LogItem(props: LogItemProps) {
  const { toggle: toggleOpen, value: isOpen } = useBoolean(!!props.expand);

  const messages = props.messages || [];
  const { collapsible } = props;

  return (
    <Wrapper
      className={`${props.severity} ${collapsible ? "cursor-pointer" : ""}`}
      collapsed={!isOpen}
      onClick={toggleOpen}
    >
      <Flex className="flex items-center gap-1">
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
        <Flex alignItems={"center"} justifyContent="center" w="30px">
          <Button
            className={classNames(
              `${Classes.ICON} debugger-toggle`,
              collapsible ? "visible" : "invisible",
            )}
            isIconButton
            kind="tertiary"
            size="sm"
            startIcon="expand-more"
          />
          {props.occurrences > 1 && (
            <span
              className={classNames(
                "t--debugger-log-message-occurrence debugger-occurrences",
                {
                  [props.severity]: true,
                  "hide-on-hover": collapsible,
                },
              )}
            >
              {props.occurrences}
            </span>
          )}
        </Flex>

        {props.source && (
          <EntityLink
            id={props.source.id}
            name={props.source.name}
            propertyPath={props.source.propertyPath}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
        )}
        {!(
          collapsible &&
          isOpen &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
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
      </Flex>

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
              className="t--debugger-log-state mp-mask"
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
                    className="t--debugger-console-log-data mp-mask"
                    key={Math.random()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ReactJson src={logDatum} {...reactJsonProps} />
                  </JsonWrapper>
                );
              } else {
                return (
                  <span className="debugger-label mp-mask" key={Math.random()}>
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

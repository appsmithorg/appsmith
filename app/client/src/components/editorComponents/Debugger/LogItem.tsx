import { Collapse } from "@blueprintjs/core";
import { get } from "lodash";
import { isString } from "lodash";
import {
  Log,
  LOG_CATEGORY,
  Message,
  Severity,
  SourceEntity,
} from "entities/AppsmithConsole";
import React, { useState, PropsWithChildren } from "react";
import ReactJson from "react-json-view";
import styled, { useTheme } from "styled-components";
import EntityLink, { DebuggerLinkUI } from "./EntityLink";
import { getLogIcon } from "./helpers";
import {
  AppIcon,
  Classes,
  getTypographyByKey,
  Icon,
  IconName,
  IconSize,
  Text,
  TextType,
  TooltipComponent,
} from "design-system-old";
import {
  createMessage,
  TROUBLESHOOT_ISSUE,
} from "@appsmith/constants/messages";
import ContextualMenu from "./ContextualMenu";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";

const InnerWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`

  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;

  &.${Severity.INFO} {
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.info.borderBottom};
  }

  &.${Severity.ERROR} {
    background-color: ${(props) =>
      props.theme.colors.debugger.error.backgroundColor};
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.error.borderBottom};
  }

  &.${Severity.WARNING} {
    background-color: ${(props) =>
      props.theme.colors.debugger.warning.backgroundColor};
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.warning.borderBottom};
  }

  .bp3-popover-target {
    display: inline;
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
    line-height: 16px;
    margin-left: 8px;
    margin-right: 18px;
    &.${Severity.INFO} {
      color: ${(props) => props.theme.colors.debugger.info.time};
    }

    &.${Severity.ERROR} {
      color: ${(props) => props.theme.colors.debugger.error.time};
    }

    &.${Severity.WARNING} {
      color: ${(props) => props.theme.colors.debugger.warning.time};
    }
  }
  .debugger-occurences{
    height: 18px;
    width: 18px;
    border-radius: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${Colors.GRAY_900};
    &.${Severity.INFO} {
      background-color: ${Colors.GREY_200};
    }
    margin-right: 4px;
    &.${Severity.ERROR} {
      background-color: ${Colors.RED_150};
    }
    &.${Severity.WARNING} {
      background-color: ${Colors.WARNING_DEBUGGER_GROUPING_BADGE};
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
      color: ${(props) => props.theme.colors.debugger.label};
      ${getTypographyByKey("p1")}
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      -webkit-user-select: all;  /* Chrome 49+ */
      -moz-user-select: all;     /* Firefox 43+ */
      -ms-user-select: all;      /* No support yet */
      user-select: all;          /* Likely future */
    }
    .debugger-entity {
      color: ${(props) => props.theme.colors.debugger.entity};
      ${getTypographyByKey("h6")}
      margin-left: 6px;

      & > span {
        cursor: pointer;

        &:hover {
          text-decoration: underline;
          text-decoration-color: ${(props) =>
            props.theme.colors.debugger.entity};
        }
      }
    }
  }
  .debugger-timetaken {
    color: ${(props) => props.theme.colors.debugger.entity};
    margin-left: 5px;
    ${getTypographyByKey("p2")}
    line-height: 19px;
  }

  .debugger-entity-link {
    margin-left: auto;
    ${getTypographyByKey("btnMedium")}
    color: ${(props) => props.theme.colors.debugger.entityLink};
    text-transform: uppercase;
    cursor: pointer;
  }
`;

const StyledSearchIcon = styled(AppIcon)`
  && {
    margin-left: 10px;
    padding-top: 3px;
  }
`;

const JsonWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[1]}px;
  svg {
    color: ${(props) => props.theme.colors.debugger.jsonIcon} !important;
    height: 12px !important;
    width: 12px !important;
    vertical-align: baseline !important;
  }
`;

type StyledCollapseProps = PropsWithChildren<{
  category: LOG_CATEGORY;
}>;

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
margin-top:${(props) =>
  props.isOpen && props.category === LOG_CATEGORY.USER_GENERATED
    ? " -20px"
    : " 4px"} ;
  margin-left: 120px;

  .debugger-message {
    ${getTypographyByKey("p2")}
    color: ${(props) => props.theme.colors.debugger.message};
    text-decoration-line: underline;
    cursor: pointer;
  }

  .${Classes.ICON} {
    margin-left: 10px;
  }
`;

const MessageWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[1]}px;
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
    icon: getLogIcon(e) as IconName,
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
    collapsable: showToggleIcon(e),
    occurences: e.occurrenceCount || 1,
  };
};

type LogItemProps = {
  collapsable?: boolean;
  icon: IconName;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  category: LOG_CATEGORY;
  logData?: any[];
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
  messages?: Message[];
  occurences: number;
};

function LogItem(props: LogItemProps) {
  const [isOpen, setIsOpen] = useState(!!props.expand);
  const reactJsonProps = {
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontSize: "13px",
    },
    collapsed: 1,
  };
  // The error to sent to the contextual menu
  const errorToSearch =
    props.messages && props.messages.length
      ? props.messages[0]
      : { message: { name: "", message: props.text } };

  const messages = props.messages || [];
  const { collapsable } = props;
  const theme = useTheme() as Theme;
  return (
    <Wrapper
      className={props.severity}
      collapsed={!isOpen}
      onClick={() => {
        if (collapsable) setIsOpen(!isOpen);
      }}
    >
      <InnerWrapper>
        <Icon
          className={`${Classes.ICON} debugger-toggle`}
          clickable={collapsable}
          fillColor={get(theme, "colors.debugger.jsonIcon")}
          invisible={!collapsable}
          name={"expand-more"}
          onClick={() => setIsOpen(!isOpen)}
          size={IconSize.XXXXL}
        />
        <Icon
          clickable={collapsable}
          fillColor={
            props.severity === Severity.ERROR
              ? get(theme, "colors.debugger.error.hoverIconColor")
              : ""
          }
          name={props.icon}
          size={IconSize.XL}
        />
        <span className={`debugger-time ${props.severity}`}>
          {props.timestamp}
        </span>
        {!(
          props.collapsable &&
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
              className="debugger-label t--debugger-log-message"
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
                <div onClick={(e) => e.stopPropagation()}>
                  <ContextualMenu entity={props.source} error={errorToSearch}>
                    <TooltipComponent
                      content={
                        <Text style={{ color: "#ffffff" }} type={TextType.P3}>
                          {createMessage(TROUBLESHOOT_ISSUE)}
                        </Text>
                      }
                      minimal
                      position="bottom-left"
                    >
                      <StyledSearchIcon
                        className={`${Classes.ICON}`}
                        name={"help"}
                        size={IconSize.SMALL}
                      />
                    </TooltipComponent>
                  </ContextualMenu>
                </div>
              )}
          </div>
        )}
        {props.source && (
          <EntityLink
            id={props.source.id}
            name={props.source.name}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
        )}
      </InnerWrapper>

      {collapsable && isOpen && (
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
                <ContextualMenu entity={props.source} error={e}>
                  <span className="debugger-message t--debugger-message">
                    {isString(e.message)
                      ? e.message
                      : JSON.stringify(e.message)}
                  </span>
                </ContextualMenu>
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

export default LogItem;

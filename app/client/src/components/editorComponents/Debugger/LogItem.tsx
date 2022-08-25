import { Collapse } from "@blueprintjs/core";
import { get } from "lodash";
import { Classes as BPPopover2Classes } from "@blueprintjs/popover2";
import { isString } from "lodash";
import { Classes } from "components/ads/common";
import {
  Log,
  LOG_CATEGORY,
  Message,
  Severity,
  SourceEntity,
} from "entities/AppsmithConsole";
import React, { useState } from "react";
import ReactJson from "react-json-view";
import styled, { useTheme } from "styled-components";
import EntityLink, { DebuggerLinkUI } from "./EntityLink";
import { getLogIcon } from "./helpers";
import {
  AppIcon,
  Icon,
  IconName,
  IconSize,
  Text,
  TextType,
} from "design-system";
import { getTypographyByKey } from "constants/DefaultTheme";
import { TooltipComponent } from "design-system";
import {
  createMessage,
  TROUBLESHOOT_ISSUE,
} from "@appsmith/constants/messages";
import ContextualMenu from "./ContextualMenu";

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

    .${Classes.ICON}.search-menu {
      path {
        fill: ${(props) => props.theme.colors.debugger.error.iconColor};
      }
      &:hover {
        path {
          fill: ${(props) => props.theme.colors.debugger.error.hoverIconColor};
        }
      }
    }

    .${BPPopover2Classes.POPOVER2_OPEN} {
      .${Classes.ICON}.search-menu {
        path {
          fill: ${(props) => props.theme.colors.debugger.error.hoverIconColor};
        }
      }
    }
  }

  &.${Severity.WARNING} {
    background-color: ${(props) =>
      props.theme.colors.debugger.warning.backgroundColor};
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.warning.borderBottom};
    .${Classes.ICON}.search-menu {
      path {
        fill: ${(props) => props.theme.colors.debugger.warning.iconColor};
      }
      &:hover {
        path {
          fill: ${(props) =>
            props.theme.colors.debugger.warning.hoverIconColor};
        }
      }
    }

    .${BPPopover2Classes.POPOVER2_OPEN} {
      .${Classes.ICON}.search-menu {
        path {
          fill: ${(props) =>
            props.theme.colors.debugger.warning.hoverIconColor};
        }
      }
    }
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
    ${(props) => getTypographyByKey(props, "h6")}
    line-height: 16px;
    color: ${(props) => props.theme.colors.debugger.time};
    margin-left: 8px;
    margin-right: 18px;
  }
  .debugger-description {
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
    word-break: break-word;
    max-width: 60%;

    .debugger-label {
      color: ${(props) => props.theme.colors.debugger.label};
      ${(props) => getTypographyByKey(props, "p1")}
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .debugger-entity {
      color: ${(props) => props.theme.colors.debugger.entity};
      ${(props) => getTypographyByKey(props, "h6")}
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
    ${(props) => getTypographyByKey(props, "p2")}
    line-height: 19px;
  }

  .debugger-entity-link {
    margin-left: auto;
    ${(props) => getTypographyByKey(props, "btnMedium")}
    color: ${(props) => props.theme.colors.debugger.entityLink};
    text-transform: uppercase;
    cursor: pointer;
  }
`;

const StyledSearchIcon = styled(AppIcon)`
  && {
    margin-left: 10px;
    padding-top: 1px;
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

const StyledCollapse = styled(Collapse)`
  margin-top: 4px;
  margin-left: 120px;

  .debugger-message {
    ${(props) => getTypographyByKey(props, "p2")}
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
  };
};

type LogItemProps = {
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
  const showToggleIcon = () => {
    let output = !!props.state || !!props.messages;
    if (!output && props.logData && props.logData.length > 0) {
      props.logData.forEach((item) => {
        if (typeof item === "object") {
          output = true;
        }
      });
    }
    return output;
  };
  // The error to sent to the contextual menu
  const errorToSearch =
    props.messages && props.messages.length
      ? props.messages[0]
      : { message: props.text };

  const messages = props.messages || [];
  const theme = useTheme();
  return (
    <Wrapper
      className={props.severity}
      collapsed={!isOpen}
      onClick={() => {
        if (showToggleIcon()) setIsOpen(!isOpen);
      }}
    >
      <InnerWrapper>
        <Icon
          className={`${Classes.ICON} debugger-toggle`}
          fillColor={get(theme, "colors.debugger.jsonIcon")}
          invisible={!showToggleIcon()}
          name={"expand-more"}
          onClick={() => setIsOpen(!isOpen)}
          size={IconSize.XXXXL}
        />
        <Icon
          fillColor={
            props.severity === Severity.ERROR
              ? get(theme, "colors.debugger.error.hoverIconColor")
              : ""
          }
          name={props.icon}
          size={IconSize.XL}
        />
        <span className="debugger-time">{props.timestamp}</span>
        <div className="debugger-description">
          <span className="debugger-label t--debugger-log-message">
            {props.text}
          </span>

          {props.timeTaken && (
            <span className="debugger-timetaken">{props.timeTaken}</span>
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
                      className={`${Classes.ICON} search-menu`}
                      name={"help"}
                      size={IconSize.SMALL}
                    />
                  </TooltipComponent>
                </ContextualMenu>
              </div>
            )}
        </div>
        {props.source && (
          <EntityLink
            id={props.source.id}
            name={props.source.name}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_NAME}
          />
        )}
      </InnerWrapper>

      {showToggleIcon() && isOpen && (
        <StyledCollapse isOpen={isOpen} keepChildrenMounted>
          {messages.map((e) => {
            return (
              <MessageWrapper key={e.message}>
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
            props.logData.map((logDatum: any, index: number) => {
              const joinChar =
                props.logData && index === props.logData.length - 1 ? "" : ",";
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
                    {`${logDatum}${joinChar} `}
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

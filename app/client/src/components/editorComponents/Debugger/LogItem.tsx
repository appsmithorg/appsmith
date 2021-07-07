import { Collapse, Position } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Message, Severity, SourceEntity } from "entities/AppsmithConsole";
import React, { useCallback, useState } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import EntityLink, { DebuggerLinkUI } from "./EntityLink";
import { SeverityIcon, SeverityIconColor } from "./helpers";
import { useDispatch } from "react-redux";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import Text, { TextType } from "components/ads/Text";
import { getTypographyByKey } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";
import TooltipComponent from "components/ads/Tooltip";
import { createMessage, TROUBLESHOOT_ISSUE } from "constants/messages";

const Log = styled.div<{ collapsed: boolean }>`
  padding: 9px 30px;
  display: flex;

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

  .debugger-time {
    ${(props) => getTypographyByKey(props, "h6")}
    line-height: 17px;
    color: ${(props) => props.theme.colors.debugger.time};
    margin-left: 10px;
  }
  .debugger-description {
    display: inline-block;
    margin-left: 7px;

    .debugger-toggle {
      ${(props) => props.collapsed && `transform: rotate(-90deg);`}
    }

    .debugger-label {
      color: ${(props) => props.theme.colors.debugger.label};
      margin-left: 5px;
      ${(props) => getTypographyByKey(props, "p2")}
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
    ${(props) => getTypographyByKey(props, "p2")}
    color: ${(props) => props.theme.colors.debugger.entityLink};
    text-decoration-line: underline;
    cursor: pointer;
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

const StyledSearchIcon = styled(Icon)`
  && {
    margin-left: 10px;
    vertical-align: middle;

    &:hover {
      path {
        fill: ${(props) => props.fillColor};
      }
    }
  }
`;

const MessageWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[1]}px;
`;

export const getLogItemProps = (e: Message) => {
  return {
    icon: SeverityIcon[e.severity] as IconName,
    iconColor: SeverityIconColor[e.severity],
    timestamp: e.timestamp,
    source: e.source,
    label: e.text,
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
  iconColor: string;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
  messages: Message["messages"];
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
  const showToggleIcon = props.state || props.messages;
  const dispatch = useDispatch();

  const openHelpModal = useCallback((e, message?: string) => {
    e.stopPropagation();
    const text = message || props.text;

    AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
      source: "DEBUGGER",
      searchTerm: text,
    });
    dispatch(setGlobalSearchQuery(text || ""));
    dispatch(toggleShowGlobalSearchModal());
  }, []);
  const messages = props.messages || [];

  return (
    <Log
      className={props.severity}
      collapsed={!isOpen}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Icon keepColors name={props.icon} size={IconSize.XL} />
      <span className="debugger-time">{props.timestamp}</span>
      <div className="debugger-description">
        {showToggleIcon && (
          <Icon
            className={`${Classes.ICON} debugger-toggle`}
            name={"downArrow"}
            onClick={() => setIsOpen(!isOpen)}
            size={IconSize.XXS}
          />
        )}
        {props.source && (
          <EntityLink
            id={props.source.id}
            name={props.source.name}
            type={props.source.type}
            uiComponent={DebuggerLinkUI.ENTITY_TYPE}
          />
        )}
        <span className="debugger-label">{props.text}</span>
        {props.timeTaken && (
          <span className="debugger-timetaken">{props.timeTaken}</span>
        )}
        {props.severity !== Severity.INFO && (
          <TooltipComponent
            content={
              <Text style={{ color: "#ffffff" }} type={TextType.P3}>
                {createMessage(TROUBLESHOOT_ISSUE)}
              </Text>
            }
            minimal
            position={Position.BOTTOM_LEFT}
          >
            <StyledSearchIcon
              className={Classes.ICON}
              fillColor={props.iconColor}
              name={"wand"}
              onClick={openHelpModal}
              size={IconSize.MEDIUM}
            />
          </TooltipComponent>
        )}

        {showToggleIcon && (
          <StyledCollapse isOpen={isOpen} keepChildrenMounted>
            {messages.map((e) => {
              return (
                <MessageWrapper key={e.message}>
                  <span
                    className="debugger-message"
                    onClick={(event) => openHelpModal(event, e.message)}
                  >
                    {e.message}
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
          </StyledCollapse>
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
    </Log>
  );
}

export default LogItem;

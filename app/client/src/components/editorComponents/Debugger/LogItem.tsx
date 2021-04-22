import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Message, Severity, SourceEntity } from "entities/AppsmithConsole";
import React, { useCallback, useState } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import { isString } from "lodash";
import EntityLink, { DebuggerLinkUI } from "./EntityLink";
import { SeverityIcon, SeverityIconColor } from "./helpers";
import { useDispatch } from "react-redux";
import {
  setGlobalSearchQuery,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { getTypographyByKey } from "constants/DefaultTheme";

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

  .debugger-copy-text {
    margin-left: 10px;
    vertical-align: middle;
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
  padding-top: 4px;
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
  }

  .${Classes.ICON} {
    margin-left: 10px;
  }
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
    message: e.message && isString(e.message) ? e.message : "",
    state: e.state,
    id: e.source ? e.source.id : undefined,
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
  message: string;
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
};

const LogItem = (props: LogItemProps) => {
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
  const showToggleIcon = props.state || props.message;
  const dispatch = useDispatch();

  const openHelpModal = useCallback((text: string) => {
    dispatch(setGlobalSearchQuery(text || ""));
    dispatch(toggleShowGlobalSearchModal());
  }, []);

  return (
    <Log
      className={props.severity}
      collapsed={!isOpen}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Icon name={props.icon} size={IconSize.XL} fillColor={props.iconColor} />
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
            type={props.source.type}
            name={props.source.name}
            id={props.source.id}
            uiComponent={DebuggerLinkUI.ENTITY_TYPE}
          />
        )}
        <span className="debugger-label">{props.text}</span>
        {props.timeTaken && (
          <span className="debugger-timetaken">{props.timeTaken}</span>
        )}
        <Icon
          className={`${Classes.ICON} debugger-copy-text`}
          name={"open"}
          size={IconSize.MEDIUM}
          onClick={(e) => {
            e.stopPropagation();
            openHelpModal(props.message ? props.message : props.text);
          }}
        />
        {showToggleIcon && (
          <StyledCollapse isOpen={isOpen} keepChildrenMounted>
            {props.message && (
              <div>
                <span className="debugger-message">{props.message}</span>
              </div>
            )}
            {props.state && (
              <JsonWrapper
                onClick={(e) => e.stopPropagation()}
                className="t--debugger-log-state"
              >
                <ReactJson src={props.state} {...reactJsonProps} />
              </JsonWrapper>
            )}
          </StyledCollapse>
        )}
      </div>
      {props.source && (
        <EntityLink
          type={props.source.type}
          name={props.source.name}
          id={props.source.id}
          uiComponent={DebuggerLinkUI.ENTITY_NAME}
        />
      )}
    </Log>
  );
};

export default LogItem;

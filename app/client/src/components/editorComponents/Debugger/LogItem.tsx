import { Collapse } from "@blueprintjs/core";
import { Classes } from "components/ads/common";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import copy from "copy-to-clipboard";
import { Message, Severity, SourceEntity } from "entities/AppsmithConsole";
import React, { useState } from "react";
import ReactJson from "react-json-view";
import styled from "styled-components";
import { isString } from "lodash";
import EntityLink from "./EntityLink";
import { SeverityIcon, SeverityIconColor } from "./helpers";

const Log = styled.div<{ collapsed: boolean }>`
  padding: 9px 30px;
  display: flex;

  &.${Severity.INFO} {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }

  &.${Severity.ERROR} {
    background-color: rgba(242, 43, 43, 0.08);
    border-bottom: 1px solid white;
  }

  &.${Severity.WARNING} {
    background-color: rgba(254, 184, 17, 0.1);
    border-bottom: 1px solid white;
  }

  .${Classes.ICON} {
    display: inline-block;
  }

  .debugger-time {
    font-size: 12px;
    color: #4b4848;
    line-height: 17px;
    font-weight: 500;
  }
  .debugger-description {
    display: inline-block;
    margin-left: 7px;

    .debugger-toggle {
      ${(props) => props.collapsed && `transform: rotate(-90deg);`}
    }

    .debugger-label {
      color: #4b4848;
      margin-left: 5px;
      font-size: 13px;
    }
    .debugger-entity {
      color: rgba(75, 72, 72, 0.7);
      font-weight: 500;
      font-size: 13px;

      & > span {
        cursor: pointer;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
          text-decoration-color: rgba(75, 72, 72, 0.7);
        }
      }
    }
  }
  .debugger-timetaken {
    color: rgba(75, 72, 72, 0.7);
    margin-left: 5px;
    font-size: 13px;
    line-height: 19px;
  }

  .debugger-copy-text {
    margin-left: 10px;
    vertical-align: middle;
  }
`;

const JsonWrapper = styled.div`
  padding-top: 4px;
  svg {
    color: #a9a7a7 !important;
    height: 12px !important;
    width: 12px !important;
    vertical-align: baseline !important;
  }
`;

const StyledCollapse = styled(Collapse)`
  margin-top: 4px;

  .debugger-message {
    font-size: 13px;
    color: #4b4848;
  }

  .${Classes.ICON} {
    margin-left: 10px;
  }
`;

export const getLogItemProps = (e: Message) => {
  return {
    icon: SeverityIcon[e.severity],
    iconColor: SeverityIconColor[e.severity],
    timestamp: e.timestamp,
    source: e.source,
    label: e.text,
    timeTaken: e.timeTaken ? `${e.timeTaken}ms` : "",
    severity: e.severity,
    text: e.text,
    message: e.message && isString(e.message) ? e.message : "",
    state: e.state,
    id: e.source ? e.source.id : null,
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
  state: Record<string, any>;
  id?: string;
  source: SourceEntity;
};

const LogItem = (props: LogItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <Log className={props.severity} collapsed={!isOpen}>
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
          />
        )}
        <span className="debugger-label">{props.text}</span>
        {props.timeTaken && (
          <span className="debugger-timetaken">{props.timeTaken}</span>
        )}
        <Icon
          className={`${Classes.ICON} debugger-copy-text`}
          name={"duplicate"}
          size={IconSize.SMALL}
          onClick={() => copy(props.text)}
        />
        {showToggleIcon && (
          <StyledCollapse isOpen={isOpen} keepChildrenMounted>
            {props.message && (
              <div>
                <span className="debugger-message">{props.message}</span>
                <Icon
                  name={"duplicate"}
                  size={IconSize.SMALL}
                  onClick={() => copy(props.message)}
                />
              </div>
            )}
            {props.state && (
              <JsonWrapper>
                <ReactJson src={props.state} {...reactJsonProps} />
              </JsonWrapper>
            )}
          </StyledCollapse>
        )}
      </div>
    </Log>
  );
};

export default LogItem;

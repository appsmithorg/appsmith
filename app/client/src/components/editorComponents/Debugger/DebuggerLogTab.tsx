import React, { useState } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Severity } from "entities/AppsmithConsole";
import { Classes } from "components/ads/common";
import { Collapse } from "@blueprintjs/core";
import ReactJson from "react-json-view";
import { isString } from "lodash";
import copy from "copy-to-clipboard";
import FilterHeader from "./FilterHeader";
import { useFilteredLogs } from "./utils";
import EntityLink from "./EntityLink";

const LIST_HEADER_HEIGHT = "38px";

const Log = styled.div<{ backgroundColor: string; collapsed: boolean }>`
  padding: 9px 30px;
  display: flex;
  background-color: ${(props) => props.backgroundColor};

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

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  height: calc(100% - ${LIST_HEADER_HEIGHT});
`;

const SeverityColor: any = {
  [Severity.INFO]: "rgba(3, 179, 101, 0.09)",
  [Severity.ERROR]: "rgba(242, 43, 43, 0.08)",
  [Severity.WARNING]: "rgba(254, 184, 17, 0.1)",
};

const SeverityIcon: any = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

const SeverityIconColor: any = {
  [Severity.INFO]: "rgb(255, 255, 255)",
  [Severity.ERROR]: "rgb(255, 255, 255)",
  [Severity.WARNING]: "rgb(224, 179, 14)",
};

const DebbuggerLogTab = (props: any) => {
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const logs = useFilteredLogs(query, filter);
  const filterOptions = [
    {
      label: "All",
      value: "",
    },
    { label: "Success", value: Severity.INFO },
    { label: "Warnings", value: Severity.WARNING },
    { label: "Errors", value: Severity.ERROR },
  ];
  const selectedFilter = filterOptions.find(
    (option) => option.value === filter,
  );

  return (
    <ContainerWrapper>
      <FilterHeader
        options={filterOptions}
        selected={selectedFilter}
        onChange={setQuery}
        onSelect={(value: string) => setFilter(value)}
      />
      <ListWrapper>
        {logs.map((e: any, index: any) => {
          const logItemProps = {
            icon: SeverityIcon[e.severity],
            iconColor: SeverityIconColor[e.severity],
            timestamp: e.timestamp,
            entityType: e.source ? e.source.type : null,
            label: e.text,
            timeTaken: e.timeTaken ? `${e.timeTaken}ms` : "",
            sourceName: e.source ? e.source.name : null,
            backgroundColor: SeverityColor[e.severity],
            text: e.text,
            message: e.message && isString(e.message) ? e.message : "",
            state: e.state,
            id: e.source ? e.source.id : null,
            onClose: props.onClose,
          };

          return <LogItem key={`debugger-${index}`} {...logItemProps} />;
        })}
      </ListWrapper>
    </ContainerWrapper>
  );
};

const LogItem = (props: any) => {
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
  console.log(props.entityType, "props.entityType");

  return (
    <Log backgroundColor={props.backgroundColor} collapsed={!isOpen}>
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
        {props.entityType && (
          <EntityLink
            type={props.entityType}
            name={props.sourceName}
            id={props.id}
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

export default DebbuggerLogTab;

import React, { useState } from "react";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Severity } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { Classes } from "components/ads/common";
import { Collapse } from "@blueprintjs/core";
import ReactJson from "react-json-view";
import history from "utils/history";
import { isString } from "lodash";
import copy from "copy-to-clipboard";
import { useSelector } from "store";
import { AppState } from "reducers";
import { getAction, getAllWidgetsMap } from "selectors/entitiesSelector";
import { getSelectedWidget } from "selectors/ui";
import { useNavigateToWidget } from "pages/Editor/Explorer/Widgets/WidgetEntity";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import FilterHeader from "./FilterHeader";
import { useFilteredLogs } from "./utils";

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

    .${Classes.ICON} {
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
    }
  }
  .debugger-timetaken {
    color: rgba(75, 72, 72, 0.7);
    margin-left: 5px;
    font-size: 13px;
    line-height: 19px;
  }
  .debugger-link {
    font-weight: 500;
    color: #4b4848;
    margin-left: auto;
    font-size: 13px;

    &:hover {
      cursor: pointer;
      text-decoration: underline;
      text-decoration-color: #4b4848;
    }
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

const Entity: any = {
  [ENTITY_TYPE.WIDGET]: "Widget",
  [ENTITY_TYPE.ACTION]: "Action",
};

const DebbuggerLogTab = (props: any) => {
  const [filter, setFilter] = useState("");
  const logs = useFilteredLogs(filter);
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
  console.log(selectedFilter, "selectedFilter");

  return (
    <div>
      <FilterHeader
        options={filterOptions}
        selected={selectedFilter}
        onSelect={(value: string) => setFilter(value)}
      />
      <div style={{ overflow: "auto", height: "100%" }}>
        {logs.map((e: any, index: any) => {
          const logItemProps = {
            icon: SeverityIcon[e.severity],
            iconColor: SeverityIconColor[e.severity],
            timestamp: e.timestamp,
            entityType: e.source ? Entity[e.source.type] : null,
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
      </div>
    </div>
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
  const entityNavigation = useEntityNavigation(props.entityType, props.id);
  const onNavigation = () => {
    entityNavigation && entityNavigation();
    props?.onClose();
  };

  return (
    <Log backgroundColor={props.backgroundColor} collapsed={!isOpen}>
      <Icon name={props.icon} size={IconSize.XL} fillColor={props.iconColor} />
      <span className="debugger-time">{props.timestamp}</span>
      <div className="debugger-description">
        {showToggleIcon && (
          <Icon
            name={"downArrow"}
            onClick={() => setIsOpen(!isOpen)}
            size={IconSize.XXS}
          />
        )}
        {props.entityType && (
          <span className="debugger-entity">[{props.entityType}]</span>
        )}
        <span className="debugger-label">{props.text}</span>
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
      {props.timeTaken && (
        <span className="debugger-timetaken">{props.timeTaken}</span>
      )}
      <span className="debugger-link" onClick={onNavigation}>
        {props.sourceName}
      </span>
    </Log>
  );
};

const useEntityNavigation = (type: ENTITY_TYPE, entityId: string) => {
  const widgetMap = useSelector(getAllWidgetsMap);
  const selectedWidgetId = useSelector(getSelectedWidget);
  const { navigateToWidget } = useNavigateToWidget();
  const applicationId = useSelector(getCurrentApplicationId);
  const action = useSelector((state: AppState) => getAction(state, entityId));

  if (type === Entity[ENTITY_TYPE.WIDGET]) {
    const widget = widgetMap[entityId];

    return () =>
      navigateToWidget(
        entityId,
        widget.type,
        widget.pageId,
        entityId === selectedWidgetId,
        widget.parentModalId,
      );
  } else if (type === Entity[ENTITY_TYPE.ACTION]) {
    if (action) {
      const { pageId, pluginType, id } = action;
      const actionConfig = getActionConfig(pluginType);
      const url =
        applicationId && actionConfig?.getURL(applicationId, pageId, id);

      if (url) {
        return () => history.push(url);
      }
    }
  }
};

export default DebbuggerLogTab;

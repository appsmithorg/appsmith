import { Collapse } from "@blueprintjs/core";
import React, { useState, useMemo, PropsWithChildren } from "react";
import { useSelector } from "react-redux";
import { get, keyBy } from "lodash";
import {
  ENTITY_TYPE,
  Log,
  LOG_CATEGORY,
  Message,
  Severity,
  SourceEntity,
} from "entities/AppsmithConsole";
import styled, { useTheme } from "styled-components";
import EntityLink, { DebuggerLinkUI } from "../EntityLink";
import ReactJson from "react-json-view";
import { getLogIcon } from "../helpers";
import {
  Classes,
  getTypographyByKey,
  Icon,
  IconName,
  IconSize,
} from "design-system-old";
import { Colors } from "constants/Colors";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  ApiMethodIcon,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import { getPlugins } from "selectors/entitiesSelector";
import { PluginType } from "entities/Action";

const InnerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 6px 12px 6px 12px;

  &.${Severity.INFO} {
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.info.borderBottom};
  }

  &.${Severity.ERROR} {
    background-color: #fff8f8;
    border-bottom: 1px solid #ffecec;
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
    margin-right: -4px;
    ${(props) =>
      props.collapsed
        ? `transform: rotate(-90deg);`
        : `transform: rotate(0deg); `};
  }
  .debugger-time {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    margin-left: 4px;
    cursor: default;
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

  .debugger-error-type {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    margin-left: 4px;
    margin-right: 4px;
    cursor: default;
    color: ${(props) => props.theme.colors.debugger.error.type};
  }

  .debugger-description {
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
    word-break: break-word;
    margin-right: 4px;

    .debugger-label {
      ${getTypographyByKey("h6")}
      font-weight: 400;
      letter-spacing: -0.195px;
      color: ${Colors.GRAY_800};
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: normal;
      -webkit-user-select: all; /* Chrome 49+ */
      -moz-user-select: all; /* Firefox 43+ */
      -ms-user-select: all; /* No support yet */
      user-select: all; /* Likely future */
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

  .debugger-entity-link {
    ${getTypographyByKey("h6")}
    font-weight: 400;
    letter-spacing: -0.195px;
    color: ${(props) => props.theme.colors.debugger.error.type};
    cursor: pointer;
    text-decoration-line: underline;
  }
`;

type StyledCollapseProps = PropsWithChildren<{
  category: LOG_CATEGORY;
}>;

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
  padding-top: ${(props) =>
    props.isOpen && props.category === LOG_CATEGORY.USER_GENERATED
      ? " -20px"
      : " 4px"};
  padding-left: 78px;
`;

const MessageInfo = styled.div`
  ${getTypographyByKey("h6")}
  font-weight: 400;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_800};
`;

const MessageWrapper = styled.div`
  cpadding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
  color: ${Colors.CHARCOAL};
  display: flex;
  align-items: center;

  svg {
    width: 12px;
    height: 12px;
  }
  margin-right: 4px;
`;

const LineNumber = styled.div`
  ${getTypographyByKey("h6")}
  font-weight: 400;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_500};
  min-width: 90px;
`;

const showToggleIcon = (e: Log) => {
  return !!e.state;
};

export const getLogItemProps = (e: Log) => {
  return {
    icon: getLogIcon(e) as IconName,
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
  iconId?: string;
  logType?: LOG_TYPE;
  logData?: any[];
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  messages?: Message[];
  occurences: number;
  pluginErrorDetails?: any;
};

function ErrorLogItem(props: LogItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { collapsable } = props;
  const theme = useTheme();
  const plugins = useSelector(getPlugins);
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const reactJsonProps = {
    name: null,
    enableClipboard: false,
    displayObjectSize: false,
    displayDataTypes: false,
    style: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue",
      fontSize: "11px",
      fontWeight: "400",
      letterSpacing: "-0.195px",
      lineHeight: "13px",
    },
    collapsed: 1,
  };

  const getIcon = () => {
    if (props.source) {
      if (props.source.type === ENTITY_TYPE.WIDGET && props.source.pluginType) {
        return (
          <WidgetIcon height={12} type={props.source.pluginType} width={12} />
        );
      } else if (props.source.type === ENTITY_TYPE.JSACTION) {
        return JsFileIconV2(12, 12);
      } else if (props.source.type === ENTITY_TYPE.ACTION) {
        if (
          props.source.pluginType === PluginType.API &&
          props.source.httpMethod
        ) {
          return ApiMethodIcon(props.source.httpMethod, "9px", "17px", 28);
        } else if (props.iconId && pluginGroups[props.iconId]) {
          return (
            <EntityIcon height={"12px"} width={"12px"}>
              <img
                alt="entityIcon"
                src={pluginGroups[props.iconId].iconLocation}
              />
            </EntityIcon>
          );
        }
      }
    }
    return <img alt="icon" src={undefined} />;
  };

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
          clickable={collapsable}
          fillColor={
            props.severity === Severity.ERROR
              ? get(theme, "colors.debugger.error.hoverIconColor")
              : ""
          }
          name={props.icon}
          size={IconSize.SMALL}
        />
        {props.logType !== LOG_TYPE.LINT_ERROR &&
          props.messages &&
          props.messages[0].message.name !== "SyntaxError" && (
            <span className={`debugger-time ${props.severity}`}>
              {props.timestamp}
            </span>
          )}
        {collapsable && props.logType !== LOG_TYPE.LINT_ERROR && (
          <Icon
            className={`${Classes.ICON} debugger-toggle`}
            clickable={collapsable}
            fillColor={get(theme, "colors.debugger.collapseIcon")}
            name={"expand-more"}
            onClick={() => setIsOpen(!isOpen)}
            size={IconSize.SMALL}
          />
        )}
        <span className={`debugger-error-type`}>
          {`${props.messages && props.messages[0].message.name}:`}
        </span>

        {props.source && (
          <span
            style={{
              marginRight: "4px",
              display: "flex",
              alignItems: "center",
              lineHeight: "14px",
            }}
          >
            <IconWrapper>{getIcon()}</IconWrapper>
            <EntityLink
              id={props.source.id}
              name={props.source.name}
              type={props.source.type}
              uiComponent={DebuggerLinkUI.ENTITY_NAME}
            />
            :
          </span>
        )}
        {!(
          props.collapsable &&
          isOpen &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
            <span
              className="debugger-label t--debugger-log-message"
              onClick={(e) => e.stopPropagation()}
            >
              {props.pluginErrorDetails
                ? props.pluginErrorDetails.title
                : props.messages && props.messages[0].message.text}
            </span>
          </div>
        )}
        {props.messages && props.messages[0].lineNumber ? (
          <LineNumber>
            [Ln{" "}
            {props.messages[0].lineNumber < 10
              ? "0" + (props.messages[0].lineNumber + 1)
              : props.messages[0].lineNumber + 1}
            ]
          </LineNumber>
        ) : (
          props.pluginErrorDetails &&
          props.pluginErrorDetails.appsmithErrorCode && (
            <LineNumber>
              [{props.pluginErrorDetails.appsmithErrorCode}]
            </LineNumber>
          )
        )}
      </InnerWrapper>
      {collapsable && isOpen && (
        <StyledCollapse
          category={props.category}
          isOpen={isOpen}
          keepChildrenMounted
        >
          {props.pluginErrorDetails && (
            <MessageWrapper>
              <MessageInfo>
                {props.pluginErrorDetails.appsmithErrorMessage}
              </MessageInfo>
              <MessageInfo>
                {props.pluginErrorDetails.downstreamErrorMessage}
              </MessageInfo>
            </MessageWrapper>
          )}
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
    </Wrapper>
  );
}

export default ErrorLogItem;

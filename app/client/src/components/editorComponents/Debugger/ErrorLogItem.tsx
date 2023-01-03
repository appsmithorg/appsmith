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
import React, { useState } from "react";
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
} from "design-system";
import {
  createMessage,
  TROUBLESHOOT_ISSUE,
} from "@appsmith/constants/messages";
import ContextualMenu from "./ContextualMenu";
import { Colors } from "constants/Colors";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import {
  DefaultApiIcon,
  getPluginIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";

const InnerWrapper = styled.div`
  display: flex;
  align-items: center;
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
    ${(props) =>
      props.collapsed
        ? `transform: rotate(-90deg);`
        : `transform: rotate(0deg); `};
  }
  .debugger-time {
    ${getTypographyByKey("h6")}
    font-size: 11px;
    line-height: 16px;
    margin-left: 4px;
    margin-right: 4px;
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
    font-family: "SF Pro Text";
    font-size: 11px;
    line-height: 13px;
    letter-spacing: -0.24px;
    font-weight: 500;
    margin-left: 4px;
    margin-right: 4px;
    color: ${(props) => props.theme.colors.debugger.error.type};
  }

  .debugger-occurences {
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
    margin-right: 4px;

    .debugger-label {
      font-family: "SF Pro Text";
      font-weight: 400;
      font-size: 11px;
      line-height: 13px;
      letter-spacing: -0.195px;
      color: ${Colors.GRAY_800};
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
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
  .debugger-timetaken {
    color: ${(props) => props.theme.colors.debugger.entity};
    margin-left: 5px;
    ${getTypographyByKey("p2")}
    line-height: 19px;
  }

  .debugger-entity-link {
    font-family: "SF Pro Text";
    font-size: 11px;
    line-height: 13px;
    letter-spacing: -0.24px;
    font-weight: 400;
    color: ${(props) => props.theme.colors.debugger.error.type};
    cursor: pointer;
    text-decoration-line: underline;
  }
`;

const IconWrapper = styled.span`
  line-height: ${(props) => props.theme.lineHeights[0]}px;
  color: ${Colors.CHARCOAL};
  display: flex;
  align-items: center;

  div {
    cursor: pointer;
  }

  svg {
    width: 12px;
    height: 12px;
  }
  margin-right: 4px;
`;
//margin-left: auto;
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

const LineNumber = styled.div`
  font-family: "SF Pro Text";
  font-weight: 400;
  font-size: 11px;
  line-height: 13px;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_500};
`;

const StyledCollapse = styled(Collapse)<{ category: LOG_CATEGORY }>`
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
    logType: e.logType,
    lineNumber: e.lineNumber,
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
  logType?: LOG_TYPE;
  logData?: any[];
  lineNumber?: number;
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  expand?: boolean;
  messages?: Message[];
  occurences: number;
};

function LogItem(props: LogItemProps) {
  console.log("ondhu123 ", props);
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
      : { message: props.text };

  const messages = props.messages || [];
  const { collapsable } = props;
  const theme = useTheme();

  const getIcon = () => {
    if (props.logType === LOG_TYPE.LINT_ERROR) {
      return <IconWrapper>{JsFileIconV2(12, 12)}</IconWrapper>;
    }
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
          props.logType !== LOG_TYPE.EVAL_ERROR && (
            <span className={`debugger-time ${props.severity}`}>
              {props.timestamp}
            </span>
          )}
        {collapsable && (
          <Icon
            className={`${Classes.ICON} debugger-toggle`}
            clickable={collapsable}
            fillColor={get(theme, "colors.debugger.collapseIcon")}
            name={"expand-more"}
            onClick={() => setIsOpen(!isOpen)}
            size={IconSize.XL}
          />
        )}
        <span className={`debugger-error-type`}>{`${props.logType}:`}</span>

        {props.source && (
          <span
            style={{
              marginRight: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {getIcon()}
            {/* <IconWrapper>{props.icon}</IconWrapper> */}
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
              props.severity === Severity.ERROR &&
              props.logType !== LOG_TYPE.LINT_ERROR && (
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
        {props.lineNumber && (
          <LineNumber>
            [Ln{" "}
            {props.lineNumber < 10 ? "0" + props.lineNumber : props.lineNumber}]
          </LineNumber>
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
                key={e.message}
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

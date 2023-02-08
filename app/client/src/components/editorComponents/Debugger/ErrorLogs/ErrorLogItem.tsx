import React, { useState } from "react";
import { get } from "lodash";
import {
  Log,
  LOG_CATEGORY,
  Message,
  Severity,
  SourceEntity,
} from "entities/AppsmithConsole";
import styled, { useTheme } from "styled-components";
import { getLogIcon } from "../helpers";
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
import { Colors } from "constants/Colors";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import LogCollapseData from "./components/LogCollapseData";
import LogAdditionalInfo from "./components/LogAdditionalInfo";
import { PluginErrorDetails } from "api/ActionAPI";
import ContextualMenu from "../ContextualMenu";
import LogEntityLink from "./components/LogEntityLink";
import LogTimeStamp from "./components/LogTimeStamp";

const InnerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 6px 12px 6px 12px;
  cursor: default;

  &.${Severity.INFO} {
    border-bottom: 1px solid
      ${(props) => props.theme.colors.debugger.info.borderBottom};
  }

  &.${Severity.ERROR} {
    background-color: #fff8f8;
    border-bottom: 1px solid #ffebeb;
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
    font-weight: 500;
    color: ${Colors.GRAY_500};
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
    color: ${(props) => props.theme.colors.debugger.error.type};
  }

  .debugger-description {
    display: flex;
    align-items: center;
    overflow-wrap: anywhere;
    word-break: break-word;

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

const StyledSearchIcon = styled(AppIcon)`
  height: 14px;
  width: 14px;
  svg {
    height: 14px;
    width: 14px;
  }
`;

const ContextWrapper = styled.div`
  height: 14px;
  display: flex;
  align-items: center;
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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
    pluginErrorDetails: e.pluginErrorDetails,
  };
};

export type LogItemProps = {
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
  pluginErrorDetails?: PluginErrorDetails;
};

function ErrorLogItem(props: LogItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { collapsable } = props;
  const theme = useTheme();

  return (
    <Wrapper className={props.severity} collapsed={!isOpen}>
      <InnerWrapper
        onClick={() => {
          if (collapsable) setIsOpen(!isOpen);
        }}
      >
        <FlexWrapper
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Icon
            clickable={false}
            fillColor={
              props.severity === Severity.ERROR
                ? get(theme, "colors.debugger.error.hoverIconColor")
                : ""
            }
            name={props.icon}
            size={IconSize.SMALL}
          />

          {props.logType &&
            props.logType !== LOG_TYPE.LINT_ERROR &&
            props.messages &&
            props.messages[0].message.name !== "SyntaxError" && (
              <LogTimeStamp
                severity={props.severity}
                timestamp={props.timestamp}
              />
            )}
          {collapsable && props.logType !== LOG_TYPE.LINT_ERROR && (
            <Icon
              className={`${Classes.ICON} debugger-toggle`}
              clickable={collapsable}
              fillColor={get(theme, "colors.debugger.collapseIcon")}
              name={"expand-more"}
              onClick={() => setIsOpen(!isOpen)}
              size={IconSize.MEDIUM}
            />
          )}
          <div className={`debugger-error-type`}>
            {`${props.messages && props.messages[0].message.name}:`}
          </div>

          <LogEntityLink {...props} />
        </FlexWrapper>
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
                : props.messages && props.messages[0].message.message}
            </span>
          </div>
        )}
        {props.messages && props.messages[0].lineNumber && (
          <LogAdditionalInfo
            text={`Ln ${
              props.messages[0].lineNumber < 9
                ? "0" + (props.messages[0].lineNumber + 1)
                : props.messages[0].lineNumber + 1
            }`}
            width="40px"
          />
        )}
        {props.category === LOG_CATEGORY.PLATFORM_GENERATED &&
          props.severity === Severity.ERROR &&
          props.logType !== LOG_TYPE.LINT_ERROR && (
            <ContextWrapper onClick={(e) => e.stopPropagation()}>
              <ContextualMenu
                entity={props.source}
                error={{ message: { name: "", message: "" } }}
              >
                <TooltipComponent
                  content={
                    <Text style={{ color: "#ffffff" }} type={TextType.P3}>
                      {createMessage(TROUBLESHOOT_ISSUE)}
                    </Text>
                  }
                  minimal
                  position="bottom-right"
                >
                  <StyledSearchIcon
                    className={`${Classes.ICON}`}
                    name={"help"}
                    size={IconSize.SMALL}
                  />
                </TooltipComponent>
              </ContextualMenu>
            </ContextWrapper>
          )}
      </InnerWrapper>
      {collapsable && isOpen && <LogCollapseData isOpen={isOpen} {...props} />}
    </Wrapper>
  );
}

export default ErrorLogItem;

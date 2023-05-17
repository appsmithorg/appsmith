import React from "react";
import { useDispatch } from "react-redux";
import { get } from "lodash";
import type { Log, Message, SourceEntity } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import styled, { useTheme } from "styled-components";
import type { IconName } from "design-system-old";
import { Classes, getTypographyByKey, Icon, IconSize } from "design-system-old";
import { Colors } from "constants/Colors";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { PluginErrorDetails } from "api/ActionAPI";
import LogCollapseData from "./components/LogCollapseData";
import LogAdditionalInfo from "./components/LogAdditionalInfo";
import LogEntityLink from "./components/LogEntityLink";
import LogTimeStamp from "./components/LogTimeStamp";
import { getLogIcon } from "../helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import moment from "moment";
import LogHelper from "./components/LogHelper";
import { toggleExpandErrorLogItem } from "actions/debuggerActions";

const InnerWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;
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
    flex-shrink: 0;
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
    flex-shrink: 0;
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
    flex-shrink: 0;
  }
`;

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const showToggleIcon = (e: Log) => {
  return !!e.state;
};

//format the requestedAt timestamp to a readable format.
export const getUpdateTimestamp = (state?: Record<string, any>) => {
  if (state) {
    //clone state to avoid mutating the original state.
    const copyState = JSON.parse(JSON.stringify(state));
    copyState.requestedAt = moment(copyState.requestedAt).format(
      "YYYY-MM-DD HH:mm:ss",
    );
    return copyState;
  }
  return state;
};

// returns required parameters for log item
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
    state: getUpdateTimestamp(e.state),
    id: e.source ? e.source.id : undefined,
    messages: e.messages,
    collapsable: showToggleIcon(e),
    pluginErrorDetails: e.pluginErrorDetails,
    isExpanded: e.isExpanded,
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
  isExpanded: boolean;
};

// Log item component
function ErrorLogItem(props: LogItemProps) {
  const dispatch = useDispatch();
  const expandToggle = () => {
    if (props.id) {
      //Add telemetry for expand.
      if (!props.isExpanded) {
        AnalyticsUtil.logEvent("DEBUGGER_LOG_ITEM_EXPAND", {
          errorType: props.logType,
          errorSubType: props.messages && props.messages[0].message.name,
          appsmithErrorCode: props.pluginErrorDetails?.appsmithErrorCode,
          downstreamErrorCode: props.pluginErrorDetails?.downstreamErrorCode,
        });
      }
      //update to redux store
      dispatch(toggleExpandErrorLogItem(props.id, !props.isExpanded));
    }
  };

  const { collapsable } = props;
  const theme = useTheme();

  return (
    <Wrapper className={props.severity} collapsed={!props.isExpanded}>
      <InnerWrapper
        onClick={() => {
          if (collapsable) expandToggle();
        }}
      >
        <FlexWrapper>
          <Icon
            clickable={false}
            fillColor={
              props.severity === Severity.ERROR
                ? get(theme, "colors.debugger.error.hoverIconColor")
                : ""
            }
            name={props.icon}
            size={IconSize.XL}
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
              data-cy="t--debugger-toggle"
              data-isOpen={props.isExpanded}
              fillColor={get(theme, "colors.debugger.collapseIcon")}
              name={"expand-more"}
              onClick={() => expandToggle()}
              size={IconSize.XL}
            />
          )}
          <div className={`debugger-error-type`}>
            {`${props.messages && props.messages[0].message.name}:`}
          </div>

          <LogEntityLink {...props} />
        </FlexWrapper>
        {!(
          props.collapsable &&
          props.isExpanded &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
            <span
              className="debugger-label"
              data-cy="t--debugger-log-message"
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
          />
        )}
        {props.category === LOG_CATEGORY.PLATFORM_GENERATED &&
          props.severity === Severity.ERROR &&
          props.logType !== LOG_TYPE.LINT_ERROR && (
            <LogHelper
              logType={props.logType}
              name={props.messages ? props.messages[0].message.name : ""}
              pluginErrorDetails={props.pluginErrorDetails}
              source={props.source}
            />
          )}
      </InnerWrapper>
      {collapsable && props.isExpanded && (
        <LogCollapseData isOpen={props.isExpanded} {...props} />
      )}
    </Wrapper>
  );
}

export default ErrorLogItem;

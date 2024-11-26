import React from "react";
import { useDispatch } from "react-redux";
import type { Log, Message, SourceEntity } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import styled from "styled-components";
import { Classes, getTypographyByKey } from "@appsmith/ads-old";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { PluginErrorDetails } from "api/ActionAPI";
import LogCollapseData from "./components/LogCollapseData";
import LogAdditionalInfo from "./components/LogAdditionalInfo";
import LogEntityLink from "./components/LogEntityLink";
import { getLogIcon } from "../helpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import moment from "moment";
import LogHelper from "./components/LogHelper";
import { toggleExpandErrorLogItem } from "actions/debuggerActions";
import { Button, Icon } from "@appsmith/ads";

const InnerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Wrapper = styled.div<{ collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;
  cursor: default;
  border-bottom: 1px solid var(--ads-v2-color-border);

  &.${Severity.ERROR} {
    background-color: var(--ads-v2-color-bg-error);
  }

  &.${Severity.WARNING} {
    background-color: var(--ads-v2-color-bg-warning);
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
    color: var(--ads-v2-color-fg-muted);
    cursor: default;
    flex-shrink: 0;
    width: max-content;
  }

  .debugger-error-type {
    ${getTypographyByKey("h6")}
    letter-spacing: -0.24px;
    color: var(--ads-v2-color-fg);
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
      color: var(--ads-v2-color-fg);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: normal;
      -webkit-user-select: all; /* Chrome 49+ */
      -moz-user-select: all; /* Firefox 43+ */
      -ms-user-select: all; /* No support yet */
      user-select: all; /* Likely future */
    }

    .debugger-entity {
      color: var(--ads-v2-color-fg);
      ${getTypographyByKey("h6")}
      margin-left: 6px;

      & > span {
        &:hover {
          text-decoration: underline;
          text-decoration-color: var(--ads-v2-color-fg);
        }
      }
    }
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
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    icon: getLogIcon(e) as string,
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
    environmentName: e.environmentName,
  };
};

export interface LogItemProps {
  collapsable?: boolean;
  icon: string;
  timestamp: string;
  label: string;
  timeTaken: string;
  severity: Severity;
  text: string;
  category: LOG_CATEGORY;
  iconId?: string;
  logType?: LOG_TYPE;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logData?: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: Record<string, any>;
  id?: string;
  source?: SourceEntity;
  messages?: Message[];
  pluginErrorDetails?: PluginErrorDetails;
  isExpanded: boolean;
  environmentName?: string;
}

// Log item component
const ErrorLogItem = (props: LogItemProps) => {
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

  const errorType = props.messages && props.messages[0].message.name;

  const errorTitle = props.pluginErrorDetails
    ? props.pluginErrorDetails.title
    : props.messages && props.messages[0].message.message;

  return (
    <Wrapper className={props.severity} collapsed={!props.isExpanded}>
      <InnerWrapper
        onClick={() => {
          if (collapsable) expandToggle();
        }}
      >
        <FlexWrapper>
          <Icon
            color={
              props.severity === Severity.ERROR
                ? "var(--ads-v2-color-fg-on-error)"
                : "inherit"
            }
            name={props.icon}
            size="md"
          />
          {collapsable && props.logType !== LOG_TYPE.LINT_ERROR && (
            <Button
              className={`${Classes.ICON} debugger-toggle`}
              data-isopen={props.isExpanded}
              data-testid="t--debugger-toggle"
              isDisabled={!collapsable}
              isIconButton
              kind="tertiary"
              onClick={() => expandToggle()}
              startIcon={"expand-more"}
            />
          )}
          <LogEntityLink {...props} />

          {props.environmentName && (
            <LogAdditionalInfo
              text={`${
                props.environmentName.charAt(0).toUpperCase() +
                props.environmentName.slice(1)
              }`}
            />
          )}
          <div className={`debugger-error-type`}>{errorType}</div>
        </FlexWrapper>
        {!(
          props.collapsable &&
          props.isExpanded &&
          props.category === LOG_CATEGORY.USER_GENERATED
        ) && (
          <div className="debugger-description">
            <span
              className="debugger-label"
              data-testid="t--debugger-log-message"
              onClick={(e) => e.stopPropagation()}
            >
              {errorTitle}
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
              message={errorTitle}
              name={errorType}
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
};

export default ErrorLogItem;

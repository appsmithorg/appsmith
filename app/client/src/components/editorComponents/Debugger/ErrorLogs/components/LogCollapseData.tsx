import type { PropsWithChildren } from "react";
import React from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { LOG_CATEGORY } from "entities/AppsmithConsole";
import { getTypographyByKey } from "@appsmith/ads-old";
import ReactJson from "react-json-view";
import { Colors } from "constants/Colors";
import LogAdditionalInfo from "./LogAdditionalInfo";

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
  padding-top: ${(props) =>
    props.isOpen && props.category === LOG_CATEGORY.USER_GENERATED
      ? " -20px"
      : " 8px"};
  padding-left: 87px;
`;

type StyledCollapseProps = PropsWithChildren<{
  category: LOG_CATEGORY;
}>;

const MessageInfo = styled.div`
  ${getTypographyByKey("h6")}
  font-weight: 400;
  letter-spacing: -0.195px;
  color: ${Colors.GRAY_800};
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

const MessageWrapper = styled.div`
  cpadding-bottom: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const JsonWrapper = styled.div`
  word-break: break-all;
  svg {
    color: ${(props) => props.theme.colors.debugger.jsonIcon} !important;
    height: 12px !important;
    width: 12px !important;
    vertical-align: baseline !important;
  }
`;

// This is the props that are passed to the react-json-view component.
export const reactJsonProps = {
  name: null,
  enableClipboard: false,
  displayObjectSize: false,
  displayDataTypes: false,
  style: {
    fontFamily: "var(--ads-v2-font-family)",
    fontSize: "11px",
    fontWeight: "400",
    letterSpacing: "-0.195px",
    lineHeight: "13px",
  },
  collapsed: 1,
};

// This component is used to render the collapsed information in the error logs.
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LogCollapseData(props: any) {
  return (
    <StyledCollapse
      category={props.category}
      isOpen={props.isOpen}
      keepChildrenMounted
    >
      {props.pluginErrorDetails && (
        <MessageWrapper>
          <MessageInfo>
            <LogAdditionalInfo
              text={props.pluginErrorDetails.appsmithErrorCode}
            />
            <span>{props.pluginErrorDetails.appsmithErrorMessage}</span>
          </MessageInfo>
          <MessageInfo>
            {props.pluginErrorDetails.downstreamErrorMessage && (
              <>
                <LogAdditionalInfo
                  datacy="t--debugger-downStreamErrorCode"
                  text={
                    props.pluginErrorDetails.downstreamErrorCode
                      ? props.pluginErrorDetails.downstreamErrorCode
                      : "DownstreamError"
                  }
                />
                <span data-testid="t--debugger-downStreamErrorMsg">
                  {props.pluginErrorDetails.downstreamErrorMessage}
                </span>
              </>
            )}
          </MessageInfo>
          {props.state && (
            <JsonWrapper
              className="t--debugger-log-state"
              onClick={(e) => e.stopPropagation()}
            >
              <ReactJson src={props.state} {...reactJsonProps} />
            </JsonWrapper>
          )}
        </MessageWrapper>
      )}
    </StyledCollapse>
  );
}

import React, { PropsWithChildren } from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "styled-components";
import { LOG_CATEGORY } from "entities/AppsmithConsole";
import { getTypographyByKey } from "design-system-old";
import ReactJson from "react-json-view";
import { Colors } from "constants/Colors";
import LogAdditionalInfo from "./LogAdditionalInfo";

const StyledCollapse = styled(Collapse)<StyledCollapseProps>`
  padding-top: ${(props) =>
    props.isOpen && props.category === LOG_CATEGORY.USER_GENERATED
      ? " -20px"
      : " 4px"};
  padding-left: 83px;
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

export default function LogCollapseData(props: any) {
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
              width="90px"
            />
            <span>{props.pluginErrorDetails.appsmithErrorMessage}</span>
          </MessageInfo>
          <MessageInfo>
            {props.pluginErrorDetails.downstreamErrorMessage && (
              <>
                <LogAdditionalInfo
                  text={
                    props.pluginErrorDetails.downstreamErrorCode
                      ? props.pluginErrorDetails.downstreamErrorCode
                      : "Downstream Error"
                  }
                  width="90px"
                />
                <span data-cy="t--debugger-downStreamErrorMsg">
                  {props.pluginErrorDetails.downstreamErrorMessage}
                </span>
              </>
            )}
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
  );
}

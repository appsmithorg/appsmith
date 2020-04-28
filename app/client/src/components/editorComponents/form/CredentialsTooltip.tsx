import React from "react";
import { Popover, PopoverInteractionKind } from "@blueprintjs/core";
import styled, { createGlobalStyle } from "styled-components";
import { Colors } from "constants/Colors";
import { FormIcons } from "icons/FormIcons";

const CredentialTooltipWrapper = styled.div`
  .credentialTooltipContainer {
    display: flex;
    margin-left: 5px;
  }
  .infoIconDiv {
    margin-top: -2px;
    margin-left: 2px;
  }
  .credentialTitle {
    color: ${Colors.CADET_BLUE};
  }
`;

const TooltipStyles = createGlobalStyle`
 .credentials-tooltip{
  .bp3-popover {
    box-shadow: none;
    max-width: 340px;
    .bp3-popover-arrow {
      display: block;
      fill: none;
    }
    .bp3-popover-arrow-fill {
      fill:  ${Colors.BLUE_CHARCOAL};
    }
    .bp3-popover-content {
      padding: 15px;
      background-color: ${Colors.BLUE_CHARCOAL};
      max-height: 300px;
      overflow: auto;
      color: ${Colors.WHITE};
      text-align: left;
      border-radius: 4px;
      text-transform: initial;
      font-weight: 500;
      font-size: 14px;
      line-height: 18px;
    }
  }
 }
`;

const IconContainer = styled.div`
  .bp3-icon {
    border-radius: 4px 0 0 4px;
    margin: 0;
    height: 30px;
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${Colors.AQUA_HAZE};
    svg {
      height: 20px;
      width: 20px;
      path {
        fill: #979797;
      }
    }
  }
  .bp3-popover-target {
    padding-right: 10px;
  }
`;

interface Props {
  providerCredentialSteps: string;
}

const HelperTooltip = (props: Props) => {
  return (
    <CredentialTooltipWrapper>
      <div className="credentialTooltipContainer">
        <div>
          <span className="credentialTitle">How to get Credentials?</span>
        </div>
        <div className="infoIconDiv">
          <TooltipStyles />
          <Popover
            autoFocus={true}
            canEscapeKeyClose={true}
            content={
              <div>
                <span>How to get credentials: </span>
                <p
                  style={{ color: "#d0d7dd", fontWeight: 100 }}
                  dangerouslySetInnerHTML={{
                    __html: props.providerCredentialSteps
                      .split("\\n\\n")
                      .join("<br />")
                      .split("\\n")
                      .join("<br /><br />"),
                  }}
                ></p>
              </div>
            }
            position="bottom"
            defaultIsOpen={false}
            interactionKind={PopoverInteractionKind.HOVER}
            usePortal
            portalClassName="credentials-tooltip"
          >
            <IconContainer style={{ display: "inline-block" }}>
              <FormIcons.INFO_ICON
                width={22}
                height={22}
                style={{
                  cursor: "pointer",
                }}
              />
            </IconContainer>
          </Popover>
        </div>
      </div>
    </CredentialTooltipWrapper>
  );
};

export default HelperTooltip;

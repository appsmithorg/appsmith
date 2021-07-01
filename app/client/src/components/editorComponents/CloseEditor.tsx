import TooltipComponent from "components/ads/Tooltip";
import React from "react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import { Icon } from "@blueprintjs/core";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const IconContainer = styled.div`
  width: 100%;
  height: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 16px;
  /* background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg}; */
`;

function CloseEditor() {
  const history = useHistory();
  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );
    e.stopPropagation();
    history.goBack();
  };

  return (
    <TooltipComponent
      content={
        <Text style={{ color: "#ffffff" }} type={TextType.P3}>
          Close
        </Text>
      }
      minWidth="auto !important"
      minimal
      position={Position.BOTTOM_LEFT}
    >
      <IconContainer onClick={handleClose}>
        <Icon icon="chevron-left" iconSize={16} />
        <Text
          style={{ color: "#0c0000", lineHeight: "14px" }}
          type={TextType.P1}
        >
          Back
        </Text>
      </IconContainer>
    </TooltipComponent>
  );
}

export default CloseEditor;

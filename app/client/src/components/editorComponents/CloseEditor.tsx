import TooltipComponent from "components/ads/Tooltip";
import { BUILDER_PAGE_URL } from "constants/routes";
import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import Text, { TextType } from "components/ads/Text";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import Icon, { IconSize } from "components/ads/Icon";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";

const IconContainer = styled.div`
  width: 22px;
  height: 22px;
  display: flex;
  margin-right: 16px;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  svg {
    width: 12px;
    height: 12px;
    path {
      fill: ${(props) => props.theme.colors.apiPane.closeIcon};
    }
  }
  &:hover {
    background-color: ${(props) => props.theme.colors.apiPane.iconHoverBg};
  }
`;

function CloseEditor() {
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);

  const history = useHistory();
  const handleClose = (e: React.MouseEvent) => {
    PerformanceTracker.startTracking(
      PerformanceTransactionName.CLOSE_SIDE_PANE,
      { path: location.pathname },
    );
    e.stopPropagation();
    history.push(BUILDER_PAGE_URL(applicationId, pageId));
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
        <Icon
          className="close-modal-icon"
          name="close-modal"
          size={IconSize.LARGE}
        />
      </IconContainer>
    </TooltipComponent>
  );
}

export default CloseEditor;

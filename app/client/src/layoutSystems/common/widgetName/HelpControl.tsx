import React from "react";

import { Tooltip } from "@blueprintjs/core";
import {
  setHelpDefaultRefinement,
  setHelpModalVisibility,
} from "actions/helpActions";
import { Colors } from "constants/Colors";
import { HelpMap } from "constants/HelpConstants";
import type { WidgetType } from "constants/WidgetConstants";
import { useDispatch } from "react-redux";
import styled from "styled-components";

import { Icon } from "@appsmith/ads";

const StyledHelpIcon = styled.div`
  justify-self: flex-start;
  cursor: pointer;
  align-self: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  margin-right: 2px;
  background: ${(props) => props.theme.colors.widgetBorder};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  & > span {
    height: 12px;
  }
  &:hover {
    background: ${Colors.OUTER_SPACE};
  }
`;

export function HelpControl(props: { type: WidgetType; show: boolean }) {
  const dispatch = useDispatch();
  return props.show ? (
    <StyledHelpIcon
      className="control t--widget-help-control"
      onClick={() => {
        dispatch(setHelpDefaultRefinement(HelpMap[props.type].searchKey));
        dispatch(setHelpModalVisibility(true));
        // window.open(`${HelpBaseURL}${HelpMap[props.type]}`, "_blank");
      }}
    >
      <Tooltip content="Open Help" hoverOpenDelay={500} position="top">
        <Icon name="help-control" size="sm" />
      </Tooltip>
    </StyledHelpIcon>
  ) : null;
}

export default HelpControl;

import React from "react";
import { useDispatch } from "react-redux";
import { Tooltip } from "@blueprintjs/core";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
import { HelpMap } from "constants/HelpConstants";
import {
  setHelpDefaultRefinement,
  setHelpModalVisibility,
} from "actions/helpActions";
import { WidgetType } from "constants/WidgetConstants";

const HelpIcon = ControlIcons.HELP_CONTROL;
const helpControlIcon = (
  <HelpIcon background="transparent" height={14} width={14} />
);

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
        {helpControlIcon}
      </Tooltip>
    </StyledHelpIcon>
  ) : null;
}

export default HelpControl;

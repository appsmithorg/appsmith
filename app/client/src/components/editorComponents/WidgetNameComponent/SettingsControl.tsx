import React, { CSSProperties } from "react";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import { Tooltip, Classes } from "@blueprintjs/core";
// I honestly can't think of a better name for this enum
export enum Activities {
  HOVERING,
  SELECTED,
  ACTIVE,
  NONE,
}
const StyledTooltip = styled(Tooltip)`
  .${Classes.POPOVER_TARGET} {
    height: 100%;
  }
`;
const SettingsWrapper = styled.div`
  justify-self: flex-end;
  height: 100%;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  & {
    pre {
      margin: 0 5px 0 0;
      font-size: ${props => props.theme.fontSizes[3]}px;
      height: ${props => props.theme.fontSizes[3]}px;
      line-height: ${props => props.theme.fontSizes[3] - 1}px;
    }
  }
  border-radius: 2px;
`;

const WidgetName = styled.span`
  margin-right: 5px;
`;

type SettingsControlProps = {
  toggleSettings: (e: any) => void;
  activity: Activities;
  name: string;
};

const SettingsIcon = ControlIcons.SETTINGS_CONTROL;

const getStyles = (activity: Activities): CSSProperties | undefined => {
  switch (activity) {
    case Activities.ACTIVE:
      return {
        background: Colors.JAFFA_DARK,
        color: Colors.WHITE,
      };
    case Activities.HOVERING:
      return {
        background: Colors.WATUSI,
        color: Colors.BLACK_PEARL,
      };
    case Activities.SELECTED:
      return {
        background: Colors.OUTER_SPACE,
        color: Colors.WHITE,
      };
  }
};

export const SettingsControl = (props: SettingsControlProps) => {
  const settingsIcon = (
    <SettingsIcon
      width={12}
      height={14}
      color={
        props.activity === Activities.HOVERING
          ? Colors.BLACK_PEARL
          : Colors.WHITE
      }
    />
  );

  return (
    <StyledTooltip
      content="Edit widget properties"
      position="top-right"
      hoverOpenDelay={500}
    >
      <SettingsWrapper
        style={getStyles(props.activity)}
        onClick={props.toggleSettings}
        className="t--widget-propertypane-toggle"
      >
        <WidgetName className="t--widget-name">{props.name}</WidgetName>
        {settingsIcon}
      </SettingsWrapper>
    </StyledTooltip>
  );
};

export default SettingsControl;

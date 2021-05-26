import React, { CSSProperties } from "react";
import { ControlIcons } from "icons/ControlIcons";
import Icon, { IconSize } from "components/ads/Icon";
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
      font-size: ${(props) => props.theme.fontSizes[3]}px;
      height: ${(props) => props.theme.fontSizes[3]}px;
      line-height: ${(props) => props.theme.fontSizes[3] - 1}px;
    }
  }
  border-radius: 2px;
`;

const WidgetName = styled.span`
  margin-right: ${(props) => props.theme.spaces[1] + 1}px;
  margin-left: ${(props) => props.theme.spaces[3]}px;
`;

const StyledErrorIcon = styled(Icon)`
  &:hover {
    svg {
      path {
        fill: ${Colors.WHITE};
      }
    }
  }
  margin-right: ${(props) => props.theme.spaces[1]}px;
`;

type SettingsControlProps = {
  toggleSettings: (e: any) => void;
  activity: Activities;
  name: string;
  errorCount: number;
};

const SettingsIcon = ControlIcons.SETTINGS_CONTROL;

const getStyles = (
  activity: Activities,
  errorCount: number,
): CSSProperties | undefined => {
  if (errorCount > 0) {
    return {
      background: "red",
      color: Colors.WHITE,
    };
  }

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

export function SettingsControl(props: SettingsControlProps) {
  const settingsIcon = (
    <SettingsIcon
      color={
        !!props.errorCount
          ? Colors.WHITE
          : props.activity === Activities.HOVERING
          ? Colors.BLACK_PEARL
          : Colors.WHITE
      }
      height={14}
      width={12}
    />
  );
  const errorIcon = (
    <StyledErrorIcon
      fillColor={Colors.WHITE}
      name="warning"
      size={IconSize.SMALL}
    />
  );

  return (
    <StyledTooltip
      content="Edit widget properties"
      hoverOpenDelay={500}
      position="top-right"
    >
      <SettingsWrapper
        className="t--widget-propertypane-toggle"
        data-testid="t--widget-propertypane-toggle"
        onClick={props.toggleSettings}
        style={getStyles(props.activity, props.errorCount)}
      >
        {!!props.errorCount && (
          <>
            {errorIcon}
            <span className="t--widget-error-count">{props.errorCount}</span>
          </>
        )}
        <WidgetName className="t--widget-name">{props.name}</WidgetName>
        {settingsIcon}
      </SettingsWrapper>
    </StyledTooltip>
  );
}

export default SettingsControl;

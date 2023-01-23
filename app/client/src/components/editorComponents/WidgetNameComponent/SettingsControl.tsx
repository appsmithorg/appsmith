import { Classes, Tooltip } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system";
import { ControlIcons } from "icons/ControlIcons";
import React, { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import styled from "styled-components";
// I honestly can't think of a better name for this enum
export enum Activities {
  HOVERING,
  SELECTED,
  ACTIVE,
  NONE,
}
const StyledTooltip = styled(Tooltip)<{
  children?: React.ReactNode;
}>`
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
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
`;

const WidgetName = styled.span`
  margin-right: ${(props) => props.theme.spaces[1] + 1}px;
  margin-left: ${(props) => props.theme.spaces[3]}px;
  white-space: nowrap;
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

const BindDataIcon = ControlIcons.BIND_DATA_CONTROL;
//const SettingsIcon = ControlIcons.SETTINGS_CONTROL;

const getStyles = (
  activity: Activities,
  errorCount: number,
  isSnipingMode: boolean,
): CSSProperties | undefined => {
  if (isSnipingMode) {
    return {
      background: Colors.DANUBE,
      color: Colors.WHITE,
    };
  } else if (errorCount > 0) {
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
        color: Colors.WHITE,
      };
    case Activities.SELECTED:
      return {
        background: Colors.JAFFA_DARK,
        color: Colors.WHITE,
      };
  }
};

export function SettingsControl(props: SettingsControlProps) {
  const isSnipingMode = useSelector(snipingModeSelector);
  // const settingsIcon = (
  //   <SettingsIcon
  //     color={
  //       !!props.errorCount
  //         ? Colors.WHITE
  //         : props.activity === Activities.HOVERING
  //         ? Colors.BLACK_PEARL
  //         : Colors.WHITE
  //     }
  //     height={14}
  //     width={12}
  //   />
  // );
  const errorIcon = (
    <StyledErrorIcon
      fillColor={Colors.WHITE}
      name="warning"
      size={IconSize.SMALL}
    />
  );

  return (
    <StyledTooltip
      content={
        isSnipingMode
          ? `Bind to widget ${props.name}`
          : "Edit widget properties"
      }
      hoverOpenDelay={500}
      position="top-right"
    >
      <SettingsWrapper
        className="t--widget-propertypane-toggle"
        data-testid="t--widget-propertypane-toggle"
        onClick={props.toggleSettings}
        style={getStyles(props.activity, props.errorCount, isSnipingMode)}
      >
        {!!props.errorCount && !isSnipingMode && (
          <>
            {errorIcon}
            <span className="t--widget-error-count">{props.errorCount}</span>
          </>
        )}
        {isSnipingMode && (
          <BindDataIcon color={Colors.WHITE} height={16} width={12} />
        )}
        <WidgetName className="t--widget-name">
          {isSnipingMode ? `Bind to ${props.name}` : props.name}
        </WidgetName>
      </SettingsWrapper>
    </StyledTooltip>
  );
}

export default SettingsControl;

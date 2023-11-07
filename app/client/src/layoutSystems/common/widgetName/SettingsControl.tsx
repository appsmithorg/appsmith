import { Classes, Tooltip } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import type { CSSProperties } from "react";
import React from "react";
import { useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import styled from "styled-components";
import { Icon } from "design-system";
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
const WidgetNameBoundary = 1;
const BORDER_RADIUS = 4;
const SettingsWrapper = styled.div<{ widgetWidth: number; inverted: boolean }>`
  justify-self: flex-end;
  height: 100%;
  padding: 0 5px;
  margin-left: 0px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  outline: none;
  & {
    pre {
      margin: 0 5px 0 0;
      font-size: ${(props) => props.theme.fontSizes[3]}px;
      height: ${(props) => props.theme.fontSizes[3]}px;
      line-height: ${(props) => props.theme.fontSizes[3] - 1}px;
    }
  }
  border: ${WidgetNameBoundary}px solid ${Colors.GREY_1};
  ${(props) => {
    if (props.inverted) {
      return `border-bottom-left-radius: ${BORDER_RADIUS}px;
      border-bottom-right-radius: ${BORDER_RADIUS}px;
      border-top: none;`;
    } else {
      return `border-top-left-radius: ${BORDER_RADIUS}px;
      border-top-right-radius: ${BORDER_RADIUS}px;
      border-bottom: none;`;
    }
  }}
`;

const WidgetName = styled.span`
  width: inherit;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledErrorIcon = styled(Icon)`
  margin-right: ${(props) => props.theme.spaces[1]}px;
`;

interface SettingsControlProps {
  toggleSettings: (e: any) => void;
  activity: Activities;
  name: string;
  errorCount: number;
  inverted: boolean;
  widgetWidth: number;
}

const getStyles = (
  activity: Activities,
  errorCount: number,
  isSnipingMode: boolean,
): CSSProperties | undefined => {
  if (isSnipingMode) {
    return {
      background: "var(--ads-v2-color-fg-information)",
      color: "var(--ads-v2-color-white)",
    };
  } else if (errorCount > 0) {
    return {
      background: "var(--ads-v2-color-fg-error)",
      color: "var(--ads-v2-color-bg-error)",
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
  const errorIcon = <StyledErrorIcon name="warning" size="sm" />;

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
        inverted={props.inverted}
        onClick={props.toggleSettings}
        style={getStyles(props.activity, props.errorCount, isSnipingMode)}
        widgetWidth={props.widgetWidth}
      >
        {!!props.errorCount && !isSnipingMode && errorIcon}
        {isSnipingMode && (
          <Icon
            color="var(--ads-v2-color-white)"
            name="arrow-right-line"
            size="md"
          />
        )}
        <WidgetName className="t--widget-name">
          {isSnipingMode ? `Bind to ${props.name}` : props.name}
        </WidgetName>
      </SettingsWrapper>
    </StyledTooltip>
  );
}

export default React.memo(SettingsControl);

import { Classes, Tooltip } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { Icon, IconSize } from "design-system-old";
import { ControlIcons } from "icons/ControlIcons";
import { CSSProperties, default as React } from "react";
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
const WidgetNameBoundary = 1;
const BORDER_RADIUS = 4;
const SettingsWrapper = styled.div<{ widgetWidth: number }>`
  justify-self: flex-end;
  height: 100%;
  padding: 0 5px;
  margin-left: 0px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: ${(props) => props.widgetWidth - BORDER_RADIUS / 2}px;
  & {
    pre {
      margin: 0 5px 0 0;
      font-size: ${(props) => props.theme.fontSizes[3]}px;
      height: ${(props) => props.theme.fontSizes[3]}px;
      line-height: ${(props) => props.theme.fontSizes[3] - 1}px;
    }
  }
  border-top-left-radius: ${BORDER_RADIUS}px;
  border-top-right-radius: ${BORDER_RADIUS}px;
  border: ${WidgetNameBoundary}px solid ${Colors.GREY_1};
  border-bottom: none;
`;

const WidgetName = styled.span`
  width: inherit;
  overflow-x: hidden;
  text-overflow: ellipsis;
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
  widgetWidth: number;
};

const BindDataIcon = ControlIcons.BIND_DATA_CONTROL;

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
        widgetWidth={props.widgetWidth}
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

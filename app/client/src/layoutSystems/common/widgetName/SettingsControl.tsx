import { Classes, Tooltip } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import type { CSSProperties } from "react";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import styled from "styled-components";
import { Icon } from "design-system";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import classNames from "classnames";
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
  widgetId: string;
  icon?: string;
}

const getStyles = (
  activity: Activities,
  errorCount: number,
  isSnipingMode: boolean,
  kind: string = "primary",
): CSSProperties | undefined => {
  if (isSnipingMode) {
    return {
      background: "var(--ads-v2-color-fg-information)",
      color: "var(--ads-v2-color-white)",
    };
  } else if (kind === "secondary") {
    return {
      background: "var(--ads-v2-color-bg-primary)",
      color: "var(--ads-v2-color-fg-brand)",
      border: "1px solid var(--ads-v2-color-fg-brand)",
      borderRadius: "4px",
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

  const customiseJS = useSelector(
    (state) => state.ui.oneClickBinding.jsTriggerOnWidget,
  );

  const dispatch = useDispatch();

  const tooltip = isSnipingMode
    ? `Bind to widget ${props.name}`
    : "Edit widget properties";

  const handleClick = useCallback(
    (e) => {
      if (customiseJS) {
        dispatch({
          type: ReduxActionTypes.TOGGLE_JS_TRIGGER_ON_WIDGET,
          payload: props.widgetId,
        });
      } else {
        props.toggleSettings(e);
      }
    },
    [props.toggleSettings, customiseJS, dispatch],
  );

  return (
    <StyledTooltip content={tooltip} hoverOpenDelay={500} position="top-right">
      <SettingsWrapper
        className={classNames(
          "t--widget-propertypane-toggle",
          props.icon && "flex items-center gap-1",
        )}
        data-testid="t--widget-propertypane-toggle"
        inverted={props.inverted}
        onClick={handleClick}
        style={getStyles(
          props.activity,
          props.errorCount,
          isSnipingMode,
          props.icon ? "secondary" : "primary",
        )}
        widgetWidth={props.widgetWidth}
      >
        {props.icon && <Icon name={props.icon} size="sm" />}
        {!!props.errorCount && !isSnipingMode && !props.icon && errorIcon}
        {isSnipingMode && (
          <Icon
            color="var(--ads-v2-color-white)"
            name="arrow-right-line"
            size="md"
          />
        )}
        <WidgetName
          className={classNames("t--widget-name", props.icon && "text-xs")}
        >
          {isSnipingMode ? `Bind to ${props.name}` : props.name}
        </WidgetName>
      </SettingsWrapper>
    </StyledTooltip>
  );
}

export default React.memo(SettingsControl);

import { Colors } from "constants/Colors";
import type { CSSProperties } from "react";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { snipingModeSelector } from "selectors/editorSelectors";
import styled from "styled-components";
import { Icon, Text, Tooltip } from "design-system";
import { getIDEViewMode } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import { updateFloatingPane } from "pages/Editor/IDE/FloatingPane/actions";
import type { AppState } from "@appsmith/reducers";
import { isPropertyPaneActiveForWidget } from "pages/Editor/IDE/FloatingPane/selectors";
import type { WidgetType } from "constants/WidgetConstants";
import WidgetFactory from "WidgetProvider/factory";

// I honestly can't think of a better name for this enum
export enum Activities {
  HOVERING,
  SELECTED,
  ACTIVE,
  NONE,
}

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
  gap: 8px;
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

interface SettingsControlProps {
  toggleSettings: (e: any) => void;
  activity: Activities;
  name: string;
  errorCount: number;
  inverted: boolean;
  widgetWidth: number;
  widgetId: string;
  widgetType: WidgetType;
}

const getStyles = (
  activity: Activities,
  errorCount: number,
  isSnipingMode: boolean,
  isMiniPaneVisible: boolean,
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
  } else if (isMiniPaneVisible) {
    return {
      background: Colors.WATUSI,
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

const WidgetTypes = WidgetFactory.widgetTypes;

export function SettingsControl(props: SettingsControlProps) {
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const errorIcon = <Icon name="warning" size="sm" />;
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const [showMiniPaneIcon, setShowMiniPaneIcon] = useState(false);
  const miniPaneReferenceElementRef = useRef(null);
  const isMiniPaneVisible = useSelector((state: AppState) =>
    isPropertyPaneActiveForWidget(state, props.widgetId),
  );

  useEffect(() => {
    if (
      props.widgetType === WidgetTypes.TABLE_WIDGET_V2 ||
      props.widgetType === WidgetTypes.SELECT_WIDGET
    ) {
      setShowMiniPaneIcon(
        ideViewMode === EditorViewMode.SplitScreen &&
          segment !== EditorEntityTab.UI,
      );
    }
  }, [ideViewMode, props.widgetType, segment]);

  const handlerShowMiniPropertyPane = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(
      updateFloatingPane({
        isVisible: true,
        selectedWidgetId: props.widgetId,
        referenceElement: miniPaneReferenceElementRef.current,
      }),
    );
  };

  return (
    <SettingsWrapper
      className="t--widget-propertypane-toggle"
      data-testid="t--widget-propertypane-toggle"
      inverted={props.inverted}
      onClick={props.toggleSettings}
      style={getStyles(
        props.activity,
        props.errorCount,
        isSnipingMode,
        isMiniPaneVisible,
      )}
      widgetWidth={props.widgetWidth}
    >
      <Tooltip
        content={
          <Text color="var(--ads-v2-color-white)">
            {isSnipingMode ? `Bind to widget ${props.name}` : `Edit widget`}
          </Text>
        }
        mouseEnterDelay={0}
        placement="topRight"
      >
        <div className="flex">
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
        </div>
      </Tooltip>
      {showMiniPaneIcon && <div className="w-[2px] h-full bg-white" />}
      {showMiniPaneIcon && (
        <div ref={miniPaneReferenceElementRef}>
          <Icon name="widgets-v3" onClick={handlerShowMiniPropertyPane} />
        </div>
      )}
    </SettingsWrapper>
  );
}

export default React.memo(SettingsControl);

import type { DefaultRootState } from "react-redux";
import { bindDataToWidget } from "actions/propertyPaneActions";
import type { WidgetType } from "constants/WidgetConstants";
import React, { useMemo } from "react";
// import type { CSSProperties } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import { hideErrors } from "selectors/debuggerSelectors";
import {
  getIsAutoLayout,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { getIsTableFilterPaneVisible } from "selectors/tableFilterSelectors";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import WidgetFactory from "WidgetProvider/factory";
import { useShowTableFilterPane } from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import SettingsControl, { Activities } from "./SettingsControl";
import { theme } from "constants/DefaultTheme";
import {
  isCurrentWidgetActiveInPropertyPane,
  isWidgetFocused,
  isMultiSelectedWidget,
  isResizingOrDragging,
  showWidgetAsSelected,
} from "selectors/widgetSelectors";
import { RESIZE_BORDER_BUFFER } from "layoutSystems/common/resizer/common";
import { Layers } from "constants/Layers";
import memoize from "micro-memoize";
import { NavigationMethod } from "utils/history";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";

const WidgetTypes = WidgetFactory.widgetTypes;

export const WidgetNameComponentHeight = theme.spaces[10];

const PositionStyle = styled.div<{
  positionOffset: [number, number];
  topRow: number;
}>`
  position: absolute;
  display: flex;
  cursor: pointer;
  top: ${(props) =>
    props.topRow > 2
      ? `${-1 * WidgetNameComponentHeight + 1 + props.positionOffset[0]}px`
      : `calc(100% - ${1 + props.positionOffset[0]}px)`};
  height: ${WidgetNameComponentHeight}px;
  right: ${(props) => props.positionOffset[1]}px;
  z-index: ${Layers.widgetName};
`;

const ControlGroup = styled.div`
  display: flex;
  margin-left: auto;
  justify-content: flex-start;
  align-items: center;
  height: 100%;

  & > span {
    height: 100%;
  }
`;

interface WidgetNameComponentProps {
  widgetName: string;
  widgetId: string;
  parentId?: string;
  type: WidgetType;
  showControls?: boolean;
  topRow: number;
  errorCount: number;
  widgetWidth: number;
}

export function WidgetNameComponent(props: WidgetNameComponentProps) {
  const dispatch = useDispatch();
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );
  const showTableFilterPane = useShowTableFilterPane();
  const isAutoCanvasResizing = useSelector(
    (state: DefaultRootState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );
  const isAutoLayout = useSelector(getIsAutoLayout);
  // Dispatch hook handy to set a widget as focused/selected
  const { selectWidget } = useWidgetSelection();

  const isFocused = useSelector(isWidgetFocused(props.widgetId));

  const shouldHideErrors = useSelector(hideErrors);

  const isTableFilterPaneVisible = useSelector(getIsTableFilterPaneVisible);

  // True if the selected widget's property pane is open.
  const isActiveInPropertyPane = useSelector(
    isCurrentWidgetActiveInPropertyPane(props.widgetId),
  );

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const togglePropertyEditor = memoize((e: any) => {
    if (isSnipingMode) {
      dispatch(
        bindDataToWidget({
          widgetId: props.widgetId,
        }),
      );
    } else if (!isActiveInPropertyPane) {
      AnalyticsUtil.logEvent("PROPERTY_PANE_OPEN_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
      // hide table filter pane if open
      isTableFilterPaneVisible && showTableFilterPane && showTableFilterPane();
      selectWidget &&
        selectWidget(
          SelectionRequestType.One,
          [props.widgetId],
          NavigationMethod.CanvasClick,
        );
    } else {
      AnalyticsUtil.logEvent("PROPERTY_PANE_CLOSE_CLICK", {
        widgetType: props.type,
        widgetId: props.widgetId,
      });
    }

    e.preventDefault();
    e.stopPropagation();
  });
  const showAsSelected = useSelector(showWidgetAsSelected(props.widgetId));

  const isMultiSelected = useSelector(isMultiSelectedWidget(props.widgetId));
  // True when any widget is dragging or resizing, including this one
  const resizingOrDragging = useSelector(isResizingOrDragging);
  const shouldShowWidgetName = () => {
    return (
      !isAutoCanvasResizing &&
      !resizingOrDragging &&
      !isPreviewMode &&
      !isAppSettingsPaneWithNavigationTabOpen &&
      !isMultiSelected &&
      (isSnipingMode
        ? isFocused
        : props.showControls ||
          ((isFocused || showAsSelected) && !resizingOrDragging))
    );
  };

  // in sniping mode we only show the widget name tag if it's focused.
  // in case of widget selection in sniping mode, if it's successful we bind the data else carry on
  // with sniping mode.
  const showWidgetName = shouldShowWidgetName();
  const isModalWidget = props.type === WidgetTypes.MODAL_WIDGET;
  const getCurrentActivity = () => {
    let activity =
      props.type === WidgetTypes.MODAL_WIDGET
        ? Activities.HOVERING
        : Activities.NONE;

    if (isFocused) activity = Activities.HOVERING;

    if (showAsSelected) activity = Activities.SELECTED;

    if (showAsSelected && isActiveInPropertyPane) activity = Activities.ACTIVE;

    return activity;
  };

  const currentActivity = useMemo(getCurrentActivity, [
    isActiveInPropertyPane,
    isFocused,
    isModalWidget,
    showAsSelected,
  ]);

  const getPositionOffset = (): [number, number] => {
    if (isSnipingMode) {
      //ToDo: (Ashok) This is a hasty fix from my end. need to check the padding and margins and give a meaningful constant.
      return [-3, -3];
    }

    return isAutoLayout
      ? [-RESIZE_BORDER_BUFFER / 2, -RESIZE_BORDER_BUFFER / 2]
      : [0, 0];
  };

  // bottom offset is RESIZE_BORDER_BUFFER - 1 because bottom border is none for the widget name
  const positionOffset: [number, number] = useMemo(getPositionOffset, [
    isAutoLayout,
  ]);

  // const positionStyle: CSSProperties = useMemo(() => {
  //   return {
  //     top:
  //       props.topRow > 2
  //         ? `${-1 * WidgetNameComponentHeight + 1 + positionOffset[0]}px`
  //         : `calc(100% - ${1 + positionOffset[0]}px)`,
  //     height: WidgetNameComponentHeight + "px",
  //     marginLeft: positionOffset[1] + "px",
  //     zIndex: Layers.widgetName,
  //   };
  // }, [
  //   Layers?.widgetName,
  //   props.topRow,
  //   positionOffset,
  //   WidgetNameComponentHeight,
  // ]);
  return showWidgetName ? (
    <PositionStyle
      className={isSnipingMode ? "t--settings-sniping-control" : ""}
      data-testid="t--settings-controls-positioned-wrapper"
      id={"widget_name_" + props.widgetId}
      positionOffset={positionOffset}
      topRow={props.topRow}
    >
      <ControlGroup>
        <SettingsControl
          activity={currentActivity}
          errorCount={shouldHideErrors ? 0 : props.errorCount}
          inverted={props.topRow <= 2}
          name={props.widgetName}
          toggleSettings={togglePropertyEditor}
          widgetWidth={props.widgetWidth}
        />
      </ControlGroup>
    </PositionStyle>
  ) : null;
}

export default WidgetNameComponent;

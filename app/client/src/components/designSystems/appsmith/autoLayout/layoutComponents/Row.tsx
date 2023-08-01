/* eslint-disable no-console */
import React from "react";
import type {
  HighlightInfo,
  LayoutComponentProps,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import {
  generateHighlightsForRow,
  renderLayouts,
} from "utils/autoLayout/layoutComponentUtils";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import {
  FlexLayerAlignment,
  LayoutDirection,
} from "utils/autoLayout/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";

const Row = (props: LayoutComponentProps) => {
  const {
    childrenMap,
    isDropTarget,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;

  const renderChildren = () => {
    if (rendersWidgets) {
      if (!childrenMap) return null;
      const layout: string[] = props.layout as string[];
      return layout.map((id: string) => childrenMap[id]);
    } else {
      const layout: LayoutComponentProps[] =
        props.layout as LayoutComponentProps[];
      return renderLayouts(layout, childrenMap, props.containerProps);
    }
  };

  return (
    <FlexLayout
      canvasId={props.containerProps?.widgetId || ""}
      flexDirection="row"
      layoutId={layoutId}
      {...(layoutStyle || {})}
    >
      {isDropTarget && props.containerProps ? (
        <CanvasDraggingArena
          {...props.containerProps.snapSpaces}
          alignItems={props.containerProps.alignItems}
          canExtend={props.containerProps.canExtend}
          direction={
            layoutType.includes("ROW")
              ? LayoutDirection.Horizontal
              : LayoutDirection.Vertical
          }
          dropDisabled={!!props.containerProps.dropDisabled}
          layoutId={layoutId}
          noPad={props.containerProps.noPad}
          parentId={props.containerProps.parentId}
          snapRows={props.containerProps.snapRows}
          useAutoLayout={props.containerProps.useAutoLayout}
          widgetId={props.containerProps.widgetId}
          widgetName={props.containerProps.widgetName}
        />
      ) : null}
      {renderChildren()}
    </FlexLayout>
  );
};

Row.deriveHighlights = (data: {
  layoutProps: LayoutComponentProps;
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  alignment?: FlexLayerAlignment;
}): HighlightInfo[] => {
  return generateHighlightsForRow({
    ...data,
    alignment: data?.alignment || FlexLayerAlignment.Start,
  });
};

Row.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  index: number,
): LayoutComponentProps => {
  const layout: any = props.layout;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...children, ...layout.slice(index)],
  };
};

Row.removeChild = (
  props: LayoutComponentProps,
  index: number,
): LayoutComponentProps => {
  const layout: any = props.layout;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...layout.slice(index + 1)],
  };
};

export default Row;

/* eslint-disable no-console */
import React from "react";
import type {
  HighlightInfo,
  LayoutComponentProps,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import {
  generateHighlightsForRow,
  getLayoutComponent,
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
  if (rendersWidgets && childrenMap) {
    // TODO: Segregate children higher up using an HOC.
    // If a layout renders multiple layouts => segregate children.
    const layout: string[] = props.layout as string[];
    return (
      <FlexLayout
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
        {layout.map((id: string) => childrenMap[id])}
      </FlexLayout>
    );
  }
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  console.log("####", { layout });
  return (
    <FlexLayout
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
      {layout.map((item: LayoutComponentProps, index: number) => {
        const Comp = getLayoutComponent(item.layoutType);
        console.log("####", { Comp, item, index });
        return (
          <Comp
            childrenMap={childrenMap}
            containerProps={props.containerProps}
            key={index}
            {...item}
          />
        );
      })}
    </FlexLayout>
  );
};

Row.getHeight = (
  props: LayoutComponentProps,
  widgets: CanvasWidgetsReduxState,
  widgetPositions: WidgetPositions,
) => {
  const { layout, rendersWidgets } = props;
  if (rendersWidgets) {
    // TODO: Can this be stored in WidgetPositions?
    let maxHeight = 0;
    (layout as string[]).forEach((id: string) => {
      const widget = widgets[id];
      if (!widget) return;
      const { height } = widgetPositions[id];
      // TODO: compare top positions to account for flex wrap.
      maxHeight = Math.max(maxHeight, height);
    });
    return maxHeight;
  }
  // TODO: Handle nested layouts.
};

Row.getWidth = (props: LayoutComponentProps): number => {
  const { layoutId } = props;
  const el = document.getElementById("layout-" + layoutId);
  const rect: DOMRect | undefined = el?.getBoundingClientRect();
  if (!rect) return 0;
  return rect.width;
};

Row.getDOMRect = (props: LayoutComponentProps): DOMRect | undefined => {
  const { layoutId } = props;
  const el = document.getElementById("layout-" + layoutId);
  const rect: DOMRect | undefined = el?.getBoundingClientRect();
  const mainRect: DOMRect | undefined = document
    .querySelector(".flex-container-0")
    ?.getBoundingClientRect();
  return {
    top: rect && mainRect ? rect.top - mainRect.top : 0,
    left: rect && mainRect ? rect.left - mainRect.left : 0,
    bottom: rect && mainRect ? rect.bottom - mainRect.bottom : 0,
    right: rect && mainRect ? rect.right - mainRect.right : 0,
    width: rect?.width || 0,
    height: rect?.height || 0,
    x: rect && mainRect ? rect.x - mainRect.x : 0,
    y: rect && mainRect ? rect.y - mainRect.y : 0,
  } as DOMRect;
};

Row.deriveHighlights = (data: {
  layoutProps: LayoutComponentProps;
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  rect: DOMRect | undefined;
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

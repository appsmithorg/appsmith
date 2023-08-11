import FlexBoxComponent from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { AutoLayoutDropTarget } from "components/editorComponents/AutoLayoutDropTarget";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import { isArray } from "lodash";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import React, { memo, useMemo } from "react";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import { LayoutDirection, Positioning } from "utils/autoLayout/constants";
import { getLayoutComponent } from "utils/autoLayout/layoutComponentUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { renderChildren } from "widgets/BaseWidgetHOC/render/common/canvasOnionUtils";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";

const LayoutCanvas = (props: BaseWidgetProps) => {
  const { layout } = props;
  const map: { [key: string]: any } = {};
  const arr = useMemo(
    () =>
      renderChildren(
        props.children,
        false,
        props.widgetId,
        RenderModes.CANVAS,
        {
          componentHeight: props.componentHeight,
          componentWidth: props.componentWidth,
        },
      ),
    [props.children, props.widgetId],
  );
  if (isArray(arr)) {
    for (const child of arr) {
      map[(child as JSX.Element).props?.widgetId] = child;
    }
  }
  const canvasProps = {
    ...props,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    topRow: 0,
    leftColumn: 0,
    containerStyle: "none",
    detachFromLayout: true,
    minHeight: props.minHeight || CANVAS_DEFAULT_MIN_HEIGHT_PX,
    shouldScrollContents: false,
    layout: props.layout || [],
  };
  return (
    <>
      {layout.map((item: LayoutComponentProps, index: number) => {
        const Comp = getLayoutComponent(item.layoutType);
        const snapRows = getCanvasSnapRows(
          props.bottomRow,
          props.mobileBottomRow,
          props.isMobile,
          props.appPositioningType === AppPositioningTypes.AUTO,
        );
        const { snapGrid } = getSnappedGrid(props, props.componentWidth);

        return (
          <Comp
            childrenMap={map}
            containerProps={{
              ...canvasProps,
              snapRows,
              snapSpaces: snapGrid,
            }}
            key={index}
            {...item}
          />
        );
      })}
    </>
  );
};

const SimpleCanvas = (props: BaseWidgetProps) => {
  const direction =
    props.positioning === Positioning.Vertical
      ? LayoutDirection.Vertical
      : LayoutDirection.Horizontal;
  const snapRows = getCanvasSnapRows(
    props.bottomRow,
    props.mobileBottomRow,
    props.isMobile,
    props.appPositioningType === AppPositioningTypes.AUTO,
  );
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const stretchFlexBox = !props.children || !props.children?.length;
  const children = useMemo(
    () =>
      renderChildren(
        props.children,
        false,
        props.widgetId,
        RenderModes.CANVAS,
        {
          componentHeight: props.componentHeight,
          componentWidth: props.componentWidth,
        },
      ),
    [props.children, props.widgetId],
  );
  return (
    <AutoLayoutDropTarget widgetId={props.widgetId}>
      <ContainerComponent {...props}>
        <CanvasDraggingArena
          {...snapGrid}
          alignItems={props.alignItems}
          canExtend={props.canExtend}
          direction={direction}
          dropDisabled={!!props.dropDisabled}
          noPad={props.noPad}
          parentId={props.parentId}
          snapRows={snapRows}
          useAutoLayout
          widgetId={props.widgetId}
          widgetName={props.widgetName}
        />
        <FlexBoxComponent
          flexLayers={props.flexLayers || []}
          stretchHeight={stretchFlexBox}
          useAutoLayout={props.useAutoLayout || false}
          widgetId={props.widgetId}
        >
          {children}
        </FlexBoxComponent>
      </ContainerComponent>
    </AutoLayoutDropTarget>
  );
};

export const AutoLayoutEditorCanvasOnion = memo((props: BaseWidgetProps) => {
  return (
    <WidgetComponent {...props}>
      {props.layout ? <LayoutCanvas {...props} /> : <SimpleCanvas {...props} />}
    </WidgetComponent>
  );
});

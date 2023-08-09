import FlexBoxComponent from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import { RenderModes } from "constants/WidgetConstants";
import { isArray } from "lodash";
import React from "react";
import type { CSSProperties } from "react";
import { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import { getLayoutComponent } from "utils/autoLayout/layoutComponentUtils";
import { getCanvasClassName } from "utils/generators";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { renderChildren } from "widgets/BaseWidgetHOC/render/common/canvasOnionUtils";
import { WidgetComponent } from "widgets/BaseWidgetHOC/render/common/WidgetComponent";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";

const LayoutCanvas = (props: BaseWidgetProps) => {
  const { layout } = props;
  const map: { [key: string]: any } = {};
  const arr = renderChildren(
    props.children,
    false,
    props.widgetId,
    RenderModes.CANVAS,
    {
      componentHeight: props.componentHeight,
      componentWidth: props.componentWidth,
    },
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
  const stretchFlexBox = !props.children || !props.children?.length;
  const style: CSSProperties = {
    width: "100%",
    // height: this.props.isListWidgetCanvas ? "auto" : `${height}px`,
    height: "auto",
    background: "none",
    position: "relative",
  };
  return (
    <div className={getCanvasClassName()} style={style}>
      <ContainerComponent {...props}>
        <FlexBoxComponent
          flexLayers={props.flexLayers || []}
          stretchHeight={stretchFlexBox}
          useAutoLayout={props.useAutoLayout || false}
          widgetId={props.widgetId}
        >
          {renderChildren(
            props.children,
            false,
            props.widgetId,
            RenderModes.CANVAS,
            {
              componentHeight: props.componentHeight,
              componentWidth: props.componentWidth,
            },
          )}
        </FlexBoxComponent>
      </ContainerComponent>
    </div>
  );
};

export const AutoLayoutViewerCanvasOnion = (props: BaseWidgetProps) => {
  return (
    <WidgetComponent {...props}>
      {props.layout ? <LayoutCanvas {...props} /> : <SimpleCanvas {...props} />}
    </WidgetComponent>
  );
};

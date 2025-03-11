import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { Positioning } from "layoutSystems/common/utils/constants";
import { CanvasViewerWrapper } from "layoutSystems/common/canvasViewer/CanvasViewerWrapper";
import { renderChildren } from "layoutSystems/common/utils/canvasUtils";
import { compact, sortBy } from "lodash";
import React, { useMemo } from "react";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import ContainerComponent from "widgets/ContainerWidget/component";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import type { AdditionalFixedLayoutProperties } from "./types";

export type CanvasProps = ContainerWidgetProps<WidgetProps>;

/**
 * This component implements the Canvas for Fixed Layout System in View mode.
 * This component also renders the children of the canvas with additional layout specific properties like
 * parentColumnSpace, parentRowSpace, etc.
 */

export const FixedLayoutViewerCanvas = (props: BaseWidgetProps) => {
  const { snapGrid } = getSnappedGrid(props, props.componentWidth);
  const { snapColumnSpace } = snapGrid;
  const layoutSystemProps: AdditionalFixedLayoutProperties = {
    parentColumnSpace: snapColumnSpace,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
  const defaultWidgetProps: Partial<WidgetProps> = {
    positioning: props.positioning,
  };

  // ToDO(#27617): Remove sorting of children on the view, ideally the model should be sorted, coz they are less frequently happening
  // operations. leaving it as is for now, coz it multiple cypress tests are dependent on this.
  const canvasChildren = useMemo(() => {
    /**
     * With UI modules there is a possiblity of the module to have modals and these modals needs to be
     * rendered as children of the main canvas in order for the modals to be functional. Since all the widgets
     * of a UI modules are rendered as meta widgets, the Main canvas receives the metaWidgetChildrenStructure
     * in the props.
     */
    const children = [
      ...(props?.children || []),
      ...(props?.metaWidgetChildrenStructure || []),
    ];

    return renderChildren(
      props.positioning !== Positioning.Fixed
        ? children
        : sortBy(compact(children), (child: WidgetProps) => child.topRow),
      props.widgetId,
      RenderModes.PAGE,
      defaultWidgetProps,
      layoutSystemProps,
      !!props.noPad,
    );
  }, [
    props.children,
    props.positioning,
    props.shouldScrollContents,
    props.widgetId,
    props.componentHeight,
    props.componentWidth,
    snapColumnSpace,
    props.metaWidgetChildrenStructure,
  ]);
  const snapRows = getCanvasSnapRows(props.bottomRow);

  return (
    <CanvasViewerWrapper
      isListWidgetCanvas={props.isListWidgetCanvas}
      snapRows={snapRows}
    >
      <ContainerComponent {...props}>{canvasChildren}</ContainerComponent>
    </CanvasViewerWrapper>
  );
};

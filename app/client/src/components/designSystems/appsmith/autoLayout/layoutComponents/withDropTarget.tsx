/* eslint-disable no-console */
import { AutoLayoutDropTarget } from "components/editorComponents/AutoLayoutDropTarget";
import { AutoCanvasDraggingArena } from "pages/common/CanvasArenas/AutoLayoutArenas/AutoCanvasDraggingArena";
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import { LayoutDirection } from "utils/autoLayout/constants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";

const withDropTarget = (
  Layout: any,
  layoutProps: LayoutComponentProps,
  index: number,
  containerProps?: ContainerWidgetProps<WidgetProps> & {
    snapRows: number;
    snapSpaces: any;
  },
) => {
  if (layoutProps?.isDropTarget && containerProps) {
    return (
      <AutoLayoutDropTarget key={index} widgetId={containerProps.widgetId}>
        <AutoCanvasDraggingArena
          {...containerProps.snapSpaces}
          alignItems={containerProps.alignItems}
          canExtend={containerProps.canExtend}
          direction={
            layoutProps.layoutType.includes("ROW")
              ? LayoutDirection.Horizontal
              : LayoutDirection.Vertical
          }
          dropDisabled={!!containerProps.dropDisabled}
          noPad={containerProps.noPad}
          parentId={containerProps.parentId}
          snapRows={containerProps.snapRows}
          useAutoLayout={containerProps.useAutoLayout}
          widgetId={containerProps.widgetId}
          widgetName={containerProps.widgetName}
        />
        <Layout {...layoutProps} containerProps={containerProps} />
      </AutoLayoutDropTarget>
    );
  }
  return (
    <Layout {...layoutProps} containerProps={containerProps} key={index} />
  );
};

export default withDropTarget;

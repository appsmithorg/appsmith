import React, { useContext } from "react";
import type { WidgetProps } from "widgets/BaseWidget";
import { ChildrenMapContext } from "../context/childrenMapContext";
import { renderChildWidget } from "layoutSystems/common/utils/canvasUtils";
import type { RenderModes } from "constants/WidgetConstants";

export interface WidgetRendererProps {
  canvasId: string;
  parentDropTarget: string;
  renderMode: RenderModes;
  rowIndex: number;
  widgetId: string;
}

function useChildrenContext(widgetId: string) {
  const childrenMap: Record<string, WidgetProps> =
    useContext(ChildrenMapContext);

  return childrenMap[widgetId];
}

export const WidgetRenderer = (props: WidgetRendererProps) => {
  const { canvasId, parentDropTarget, renderMode, rowIndex, widgetId } = props;
  const widgetProps = useChildrenContext(widgetId);

  if (!widgetProps) return null;

  return (
    <>
      {renderChildWidget({
        childWidgetData: widgetProps,
        defaultWidgetProps: {},
        layoutSystemProps: {
          layoutId: parentDropTarget,
          rowIndex: rowIndex,
        },
        noPad: false,
        renderMode: renderMode,
        widgetId: canvasId,
      })}
    </>
  );
};

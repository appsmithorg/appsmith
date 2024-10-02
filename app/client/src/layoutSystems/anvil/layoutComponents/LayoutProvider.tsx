import React, { useMemo } from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { WidgetProps } from "widgets/BaseWidget";
import { ChildrenMapContext } from "../context/childrenMapContext";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { RenderModes } from "constants/WidgetConstants";

export const LayoutProvider = (props: BaseWidgetProps) => {
  const { children, layout, renderMode, widgetId } = props;
  const childrenMap = useMemo(() => {
    const map: Record<string, WidgetProps> = {};

    children.forEach((child: WidgetProps) => {
      map[child.widgetId] = child;
    });

    return map;
  }, [children]);

  return (
    <ChildrenMapContext.Provider value={childrenMap}>
      {renderLayouts(
        layout,
        widgetId,
        "",
        renderMode || RenderModes.CANVAS,
        [],
      )}
    </ChildrenMapContext.Provider>
  );
};

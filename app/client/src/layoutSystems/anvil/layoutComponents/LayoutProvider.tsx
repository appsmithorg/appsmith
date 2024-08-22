import React, { useMemo } from "react";

import { RenderModes } from "constants/WidgetConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

import { ChildrenMapContext } from "../context/childrenMapContext";
import { renderLayouts } from "../utils/layouts/renderUtils";

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

import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useDetachedChildren } from "layoutSystems/anvil/common/hooks/detachedWidgetHooks";
import { renderChildWidget } from "layoutSystems/common/utils/canvasUtils";
import React from "react";
import { useSelector } from "react-redux";
import { getRenderMode } from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";

export const AnvilDetachedWidgets = () => {
  const detachedChildren = useDetachedChildren();
  const renderMode = useSelector(getRenderMode);

  return (
    <>
      {detachedChildren.map((child) =>
        renderChildWidget({
          childWidgetData: child as WidgetProps,
          defaultWidgetProps: {},
          noPad: false,
          // Adding these properties as the type insists on providing this
          // while it is not required for detached children
          layoutSystemProps: {
            layoutId: "",
            rowIndex: 0,
          },
          renderMode,
          widgetId: MAIN_CONTAINER_WIDGET_ID,
        }),
      )}
    </>
  );
};

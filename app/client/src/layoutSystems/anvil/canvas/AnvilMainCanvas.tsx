import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilCanvas } from "./AnvilCanvas";
import React, { useMemo } from "react";
import { useCanvasActivationStates } from "../canvasArenas/hooks/mainCanvas/useCanvasActivationStates";
import { useCanvasActivation } from "../canvasArenas/hooks/mainCanvas/useCanvasActivation";
import type { RenderModes } from "constants/WidgetConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { useSelector } from "react-redux";
import { getWidgets } from "sagas/selectors";
import { getRenderMode } from "selectors/editorSelectors";
import { renderChildWidget } from "layoutSystems/common/utils/canvasUtils";
import type { CanvasWidgetStructure } from "WidgetProvider/constants";

function useDetachedChildren(children: CanvasWidgetStructure[]) {
  const widgets = useSelector(getWidgets);
  const detachedChildren = useMemo(() => {
    return children
      .map((child) => widgets[child.widgetId])
      .filter((child) => child.detachFromLayout === true);
  }, [children, widgets]);
  return detachedChildren;
}

export const AnvilMainCanvas = (props: BaseWidgetProps) => {
  const anvilCanvasActivationStates = useCanvasActivationStates();
  useCanvasActivation(anvilCanvasActivationStates);
  const renderMode: RenderModes = useSelector(getRenderMode);

  const detachedChildren = useDetachedChildren(props.children);
  const renderDetachedChildren = detachedChildren.map((child) =>
    renderChildWidget({
      childWidgetData: child,
      defaultWidgetProps: {},
      noPad: false,
      // Adding these properties as the type insists on providing this
      // while it is not required for detached children
      layoutSystemProps: { parentColumnSpace: 1, parentRowSpace: 1 },
      renderMode: renderMode,
      widgetId: MAIN_CONTAINER_WIDGET_ID,
    }),
  );
  return (
    <>
      {renderDetachedChildren}
      <AnvilCanvas {...props} />
    </>
  );
};

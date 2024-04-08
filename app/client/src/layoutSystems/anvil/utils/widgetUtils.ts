import type { SetDraggingStateActionPayload } from "utils/hooks/dragResizeHooks";
import type { AnvilConfig, SizeConfig } from "WidgetProvider/constants";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import WidgetFactory from "WidgetProvider/factory";
import { isFunction } from "lodash";

export const generateDragStateForAnvilLayout = ({
  layoutId,
}: {
  layoutId: string;
}): SetDraggingStateActionPayload => {
  return {
    isDragging: true,
    dragGroupActualParent: layoutId || "",
    draggedOn: layoutId,
  };
};

export const getWidgetSizeConfiguration = (
  type: string,
  props: BaseWidgetProps,
  isPreviewMode: boolean,
): SizeConfig => {
  const { widgetSize } = WidgetFactory.getWidgetAnvilConfig(type);

  if (widgetSize && isFunction(widgetSize)) {
    return widgetSize(props, isPreviewMode);
  }

  if (widgetSize && Object.keys(widgetSize).length) {
    return widgetSize;
  }

  return {};
};

export function isLargeWidget(type: string): boolean {
  const config: AnvilConfig | null = WidgetFactory.getWidgetAnvilConfig(type);
  return config && config.isLargeWidget;
}

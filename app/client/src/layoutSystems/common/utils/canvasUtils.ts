import type { RenderModes } from "constants/WidgetConstants";
import { map } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";

function renderChildWidget({
  childWidgetData,
  defaultWidgetProps,
  layoutSystemProps,
  noPad,
  renderMode,
  widgetId,
}: {
  childWidgetData: WidgetProps;
  widgetId: string;
  renderMode: RenderModes;
  layoutSystemProps: Record<string, any>;
  defaultWidgetProps: Record<string, any>;
  noPad: boolean;
}): React.ReactNode {
  const childWidget = {
    ...defaultWidgetProps,
    ...childWidgetData,
    ...layoutSystemProps,
  };
  if (!childWidgetData) return null;
  if (noPad) childWidget.noContainerOffset = true;
  childWidget.parentId = widgetId;
  return WidgetFactory.createWidget(childWidget, renderMode);
}

export const renderChildren = (
  children: any,
  widgetId: string,
  renderMode: RenderModes,
  defaultWidgetProps = {},
  layoutSystemProps = {},
  noPad = false,
): React.ReactNode[] => {
  return map(children, (childWidgetData: WidgetProps) =>
    renderChildWidget({
      childWidgetData,
      layoutSystemProps,
      defaultWidgetProps,
      noPad,
      renderMode,
      widgetId,
    }),
  );
};

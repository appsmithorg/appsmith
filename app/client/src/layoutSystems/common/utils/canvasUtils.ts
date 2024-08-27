import type { RenderModes } from "constants/WidgetConstants";
import type { AdditionalAnvilProperties } from "layoutSystems/anvil/viewer/canvas/types";
import type { AdditionalAutoLayoutProperties } from "layoutSystems/autolayout/canvas/types";
import type { AdditionalFixedLayoutProperties } from "layoutSystems/fixedlayout/canvas/types";
import { map } from "lodash";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps } from "widgets/BaseWidget";

type LayoutSystemProps =
  | AdditionalFixedLayoutProperties
  | AdditionalAutoLayoutProperties
  | AdditionalAnvilProperties;

/**
 * This utility function renders a child widget based on the widget data passed to it.
 * when enhancing a child widget properties
 * layoutSystemProps override childWidgetData and defaultWidgetProps,
 * childWidgetData override defaultWidgetProps.
 *
 * @returns
 */
export function renderChildWidget({
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
  layoutSystemProps: LayoutSystemProps;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultWidgetProps: Record<string, any>;
  noPad: boolean;
}): React.ReactNode | null {
  if (!childWidgetData) return null;
  const childWidget = {
    ...defaultWidgetProps,
    ...childWidgetData,
    ...layoutSystemProps,
  };
  if (noPad) childWidget.noContainerOffset = true;
  childWidget.parentId = widgetId;
  return WidgetFactory.createWidget(childWidget, renderMode);
}

/**
 *
 * @param children - array of props of the children.
 * @param widgetId - id of the parent canvas.
 * @param renderMode - current render mode.
 * @param defaultWidgetProps - default props of the child widget.
 * @param layoutSystemProps - props of the layout system.
 * @param noPad - if true, noContainerOffset is set to true to the child widget.
 *
 * children is an array of childWidgetData
 * childWidgetData is props of each individual child widget.
 * layoutSystemProps override childWidgetData, childWidgetData override defaultWidgetProps.
 *
 * @returns array of child widgets.
 */
export const renderChildren = (
  children: WidgetProps[],
  widgetId: string,
  renderMode: RenderModes,
  defaultWidgetProps: Partial<WidgetProps> = {},
  layoutSystemProps: LayoutSystemProps,
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
  ).filter(Boolean);
};

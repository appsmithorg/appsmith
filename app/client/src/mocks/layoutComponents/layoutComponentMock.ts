import { RenderModes } from "constants/WidgetConstants";
import {
  LayoutComponentTypes,
  type LayoutComponentProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { WidgetProps } from "widgets/BaseWidget";
import { generateReactKey } from "utils/generators";
import { mockButtonProps } from "mocks/widgetProps/button";
import { mockInputProps } from "mocks/widgetProps/input";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export function generateLayoutComponentMock(
  data: Partial<LayoutComponentProps> = {},
  rendersWidgets = true,
): LayoutComponentProps {
  if (data?.layoutType === LayoutComponentTypes.ALIGNED_WIDGET_ROW)
    return generateAlignedRowMock(data, rendersWidgets);
  const layout: WidgetLayoutProps[] | LayoutComponentProps[] = [],
    childrenMap: { [key: string]: WidgetProps } = {};
  let type = LayoutComponentTypes.WIDGET_ROW;
  if (rendersWidgets) {
    /**
     * This generates a Row with button and input widgets in it.
     * Row
     *  Button
     *  Input
     */
    const buttonWidget: BaseWidgetProps = mockButtonProps();
    const inputWidget: BaseWidgetProps = mockInputProps();
    (layout as WidgetLayoutProps[]).push({
      widgetId: buttonWidget.widgetId,
      alignment: FlexLayerAlignment.Start,
    });
    (layout as WidgetLayoutProps[]).push({
      widgetId: inputWidget.widgetId,
      alignment: FlexLayerAlignment.Start,
    });
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  } else {
    type = LayoutComponentTypes.LAYOUT_ROW;
    (layout as LayoutComponentProps[]).push(generateLayoutComponentMock());
    (layout as LayoutComponentProps[]).push(generateLayoutComponentMock());
  }
  return {
    layout,
    layoutId: generateReactKey(),
    layoutIndex: 0,
    layoutStyle: {},
    layoutType: type,

    allowedWidgetTypes: [],
    canvasId: "",
    children: [],
    childTemplate: null,
    isDropTarget: false,
    insertChild: rendersWidgets,
    isPermanent: false,

    childrenMap,
    layoutOrder: [],
    parentDropTarget: "",
    renderMode: RenderModes.CANVAS,
    ...data,
  };
}

/**
 * This generates an AlignedRow with button and input widgets in start alignment.
 * AlignedRow
 *  Start
 *   Button
 *   Input
 *  Center
 *  End
 */
export function generateAlignedRowMock(
  data: Partial<LayoutComponentProps> = {},
  rendersWidgets = true,
): LayoutComponentProps {
  const layout: WidgetLayoutProps[] = [],
    childrenMap: { [key: string]: WidgetProps } = {};
  if (rendersWidgets) {
    const buttonWidget: BaseWidgetProps = mockButtonProps();
    const inputWidget: BaseWidgetProps = mockInputProps();
    (layout as WidgetLayoutProps[]).push({
      widgetId: buttonWidget.widgetId,
      alignment: FlexLayerAlignment.Start,
    });
    (layout as WidgetLayoutProps[]).push({
      widgetId: inputWidget.widgetId,
      alignment: FlexLayerAlignment.Start,
    });
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  }
  return {
    layout,
    layoutId: "",
    layoutIndex: 0,
    layoutStyle: {},
    layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,

    allowedWidgetTypes: [],
    canvasId: "",
    children: [],
    childTemplate: null,
    isDropTarget: false,
    insertChild: rendersWidgets,
    isPermanent: false,

    childrenMap,
    layoutOrder: [],
    parentDropTarget: "",
    renderMode: RenderModes.CANVAS,
    ...data,
  };
}

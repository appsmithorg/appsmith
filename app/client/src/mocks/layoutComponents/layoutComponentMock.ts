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
): { layout: LayoutComponentProps; childrenMap: Record<string, WidgetProps> } {
  if (data?.layoutType === LayoutComponentTypes.ALIGNED_WIDGET_ROW)
    return generateAlignedRowMock(data, rendersWidgets);

  const layout: WidgetLayoutProps[] | LayoutComponentProps[] = [];
  let childrenMap: { [key: string]: WidgetProps } = {};
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
      alignment: FlexLayerAlignment.Start,
      widgetId: buttonWidget.widgetId,
      widgetType: buttonWidget.type,
    });
    (layout as WidgetLayoutProps[]).push({
      alignment: FlexLayerAlignment.Start,
      widgetId: inputWidget.widgetId,
      widgetType: inputWidget.type,
    });
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  } else {
    type = LayoutComponentTypes.LAYOUT_ROW;
    const mock1 = generateLayoutComponentMock();
    const mock2 = generateLayoutComponentMock();

    (layout as LayoutComponentProps[]).push(mock1.layout);
    (layout as LayoutComponentProps[]).push(mock2.layout);
    childrenMap = {
      ...childrenMap,
      ...mock1.childrenMap,
      ...mock2.childrenMap,
    };
  }

  return {
    layout: {
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

      layoutOrder: [],
      parentDropTarget: "",
      renderMode: RenderModes.CANVAS,
      ...data,
    },
    childrenMap,
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
): { layout: LayoutComponentProps; childrenMap: Record<string, WidgetProps> } {
  const layout: WidgetLayoutProps[] = [],
    childrenMap: { [key: string]: WidgetProps } = {};

  if (rendersWidgets) {
    const buttonWidget: BaseWidgetProps = mockButtonProps();
    const inputWidget: BaseWidgetProps = mockInputProps();

    (layout).push({
      alignment: FlexLayerAlignment.Start,
      widgetId: buttonWidget.widgetId,
      widgetType: buttonWidget.type,
    });
    (layout).push({
      alignment: FlexLayerAlignment.Start,
      widgetId: inputWidget.widgetId,
      widgetType: inputWidget.type,
    });
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  }

  return {
    layout: {
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

      layoutOrder: [],
      parentDropTarget: "",
      renderMode: RenderModes.CANVAS,
      ...data,
    },
    childrenMap,
  };
}

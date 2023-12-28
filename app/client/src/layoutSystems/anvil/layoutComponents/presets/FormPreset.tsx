import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";
import ButtonWidget from "widgets/ButtonWidget/widget";
import TextWidget from "widgets/TextWidget/widget";

export const formPreset = (
  title: string,
  button1: string,
  button2: string,
): LayoutProps[] => {
  return [
    {
      isPermanent: true,
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.LAYOUT_COLUMN,
      layout: [
        {
          allowedWidgetTypes: ["TEXT_WIDGET"],
          isDropTarget: true,
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.WIDGET_ROW,
          layout: [
            {
              widgetId: title,
              alignment: FlexLayerAlignment.Start,
              widgetType: TextWidget.type,
            },
          ],
          layoutStyle: {
            minHeight: "40px",
          },
        },
        {
          isDropTarget: true,
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
          layout: [],
          layoutStyle: {
            minHeight: "40px",
            width: "100%",
          },
        },
        {
          isDropTarget: true,
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,
          layout: [
            {
              widgetId: button2,
              alignment: FlexLayerAlignment.End,
              widgetType: ButtonWidget.type,
            },
            {
              widgetId: button1,
              alignment: FlexLayerAlignment.End,
              widgetType: ButtonWidget.type,
            },
          ],
          layoutStyle: {
            minHeight: "40px",
          },
        },
      ],
    },
  ];
};

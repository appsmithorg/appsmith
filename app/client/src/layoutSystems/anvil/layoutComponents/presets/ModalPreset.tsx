import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";

export const modalPreset = (
  title: string,
  icon: string,
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
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.LAYOUT_ROW,
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
                },
              ],
              layoutStyle: {
                flexGrow: 1,
                minHeight: "40px",
              },
            },
            {
              allowedWidgetTypes: ["ICON_BUTTON_WIDGET"],
              isDropTarget: true,
              isPermanent: true,
              layoutId: generateReactKey(),
              layoutType: LayoutComponentTypes.WIDGET_ROW,
              layout: [
                {
                  widgetId: icon,
                  alignment: FlexLayerAlignment.Start,
                },
              ],
              layoutStyle: {
                minWidth: "30px",
                minHeight: "40px",
              },
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
            },
            {
              widgetId: button1,
              alignment: FlexLayerAlignment.End,
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

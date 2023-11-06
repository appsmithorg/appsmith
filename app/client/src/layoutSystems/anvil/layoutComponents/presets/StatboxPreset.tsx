import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";
import IconButtonWidget from "widgets/IconButtonWidget/widget";
import TextWidget from "widgets/TextWidget/widget";

export const statBoxPreset = (
  text1: string,
  text2: string,
  text3: string,
  image: string,
): LayoutProps[] => [
  {
    layoutId: generateReactKey(),
    layoutStyle: {
      wrap: "wrap-reverse",
    },
    layoutType: LayoutComponentTypes.LAYOUT_ROW,
    layout: [
      {
        isDropTarget: true,
        isPermanent: true,
        layoutId: generateReactKey(),
        layoutStyle: {
          flexGrow: 1,
        },
        layoutType: LayoutComponentTypes.LAYOUT_COLUMN,
        layout: [
          {
            layoutId: generateReactKey(),
            layoutStyle: {
              alignSelf: "stretch",
            },
            layoutType: LayoutComponentTypes.WIDGET_ROW,
            layout: [
              {
                alignment: FlexLayerAlignment.Start,
                widgetId: text1,
                widgetType: TextWidget.type,
              },
            ],
          },
          {
            layoutId: generateReactKey(),
            layoutStyle: {
              alignSelf: "stretch",
            },
            layoutType: LayoutComponentTypes.WIDGET_ROW,
            layout: [
              {
                alignment: FlexLayerAlignment.Start,
                widgetId: text2,
                widgetType: TextWidget.type,
              },
            ],
          },
          {
            layoutId: generateReactKey(),
            layoutStyle: {
              alignSelf: "stretch",
            },
            layoutType: LayoutComponentTypes.WIDGET_ROW,
            layout: [
              {
                alignment: FlexLayerAlignment.Start,
                widgetId: text3,
                widgetType: TextWidget.type,
              },
            ],
          },
        ],
      },
      {
        childTemplate: null,
        isDropTarget: true,
        isPermanent: true,
        layoutId: generateReactKey(),
        layoutStyle: {
          alignSelf: "flex-end",
        },
        layoutType: LayoutComponentTypes.WIDGET_COLUMN,
        layout: [
          {
            alignment: FlexLayerAlignment.Start,
            widgetId: image,
            widgetType: IconButtonWidget.type,
          },
        ],
      },
    ],
  },
];

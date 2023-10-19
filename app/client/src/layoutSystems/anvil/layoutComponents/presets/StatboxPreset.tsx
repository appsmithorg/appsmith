import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";

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
                widgetId: text1,
                alignment: FlexLayerAlignment.Start,
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
                widgetId: text2,
                alignment: FlexLayerAlignment.Start,
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
                widgetId: text3,
                alignment: FlexLayerAlignment.Start,
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
            widgetId: image,
            alignment: FlexLayerAlignment.Start,
          },
        ],
      },
    ],
  },
];

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
    layoutType: LayoutComponentTypes.ROW,
    layout: [
      {
        isDropTarget: true,
        isPermanent: true,
        layoutId: generateReactKey(),
        layoutStyle: {
          flexGrow: 1,
        },
        layoutType: LayoutComponentTypes.COLUMN,
        layout: [
          {
            layoutId: generateReactKey(),
            layoutStyle: {
              alignSelf: "stretch",
            },
            layoutType: LayoutComponentTypes.ROW,
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
            layoutType: LayoutComponentTypes.ROW,
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
            layoutType: LayoutComponentTypes.ROW,
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
        isDropTarget: true,
        isPermanent: true,
        layoutId: generateReactKey(),
        layoutStyle: {
          alignSelf: "flex-end",
        },
        layoutType: LayoutComponentTypes.COLUMN,
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

import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { generateReactKey } from "utils/generators";

export const formPreset = (
  title: string,
  button1: string,
  button2: string,
): LayoutProps[] => {
  return [
    {
      isPermanent: true,
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.COLUMN,
      layout: [
        {
          isDropTarget: true,
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.ROW,
          layout: [
            {
              widgetId: title,
              alignment: FlexLayerAlignment.Start,
            },
          ],
          layoutStyle: {
            minHeight: "40px",
          },
        },
        {
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.ALIGNED_COLUMN,
          layout: [],
          layoutStyle: {
            minHeight: "40px",
          },
        },
        {
          isDropTarget: true,
          isPermanent: true,
          layoutId: generateReactKey(),
          layoutType: LayoutComponentTypes.ALIGNED_ROW,
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

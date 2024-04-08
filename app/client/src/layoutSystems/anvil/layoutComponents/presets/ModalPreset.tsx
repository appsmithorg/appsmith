import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export const modalPreset = (): LayoutProps[] => {
  return [
    {
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
      layout: [],
      layoutStyle: {
        border: "none",
        height: "100%",
        minHeight: "sizing-16",
      },
      isDropTarget: true,
      isPermanent: true,
      childTemplate: {
        insertChild: true,
        isDropTarget: false,
        isPermanent: false,
        layout: [],
        layoutId: "",
        layoutType: LayoutComponentTypes.WIDGET_ROW,
        maxChildLimit: 1,
      },
    },
  ];
};

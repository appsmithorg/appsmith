import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export const zonePreset = (): LayoutProps[] => {
  return [
    {
      isContainer: true,
      isDropTarget: true,
      isPermanent: true,
      layout: [],
      layoutStyle: {
        border: "none",
        height: "100%",
      },
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.ZONE,
    },
  ];
};

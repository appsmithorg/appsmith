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
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.ZONE,
    },
  ];
};

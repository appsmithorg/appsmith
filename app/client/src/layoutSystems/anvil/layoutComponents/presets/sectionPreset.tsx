import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export const sectionPreset = (): LayoutProps[] => {
  return [
    {
      isContainer: true,
      isDropTarget: true,
      isPermanent: true,
      layout: [],
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.SECTION,
      maxChildLimit: 4,
    },
  ];
};

import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export function generateDefaultLayoutPreset(
  data: Partial<LayoutProps> = {},
): LayoutProps[] {
  return [
    {
      isDropTarget: true,
      isPermanent: true,
      layout: [],
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.ALIGNED_COLUMN,
      ...data,
    },
  ];
}

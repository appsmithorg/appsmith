import {
  LayoutComponentTypes,
  type LayoutComponentProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export function generateDefaultLayoutPreset(
  data: Partial<LayoutComponentProps> = {},
): LayoutComponentProps[] {
  return [
    {
      canvasId: "",
      isDropTarget: true,
      isPermanent: true,
      layout: [],
      layoutId: generateReactKey(),
      layoutType: LayoutComponentTypes.ALIGNED_COLUMN,
      ...data,
    },
  ];
}

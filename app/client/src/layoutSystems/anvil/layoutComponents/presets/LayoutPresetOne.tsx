import type { LayoutComponentProps } from "layoutSystems/anvil/utils/anvilTypes";
import { generateReactKey } from "utils/generators";

export function generateLayoutPresetOne(
  data: Partial<LayoutComponentProps> = {},
): LayoutComponentProps[] {
  return [
    {
      canvasId: "",
      isDropTarget: true,
      isPermanent: true,
      layout: [],
      layoutId: generateReactKey(),
      layoutType: "ALIGNED_COLUMN",
      ...data,
    },
  ];
}

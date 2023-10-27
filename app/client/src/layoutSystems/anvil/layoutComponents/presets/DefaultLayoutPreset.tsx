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
      layoutStyle: {
        border: "none",
        minHeight: "40px",
        height: "100%",
      },
      layoutType: LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN,
      ...data,
    },
  ];
}

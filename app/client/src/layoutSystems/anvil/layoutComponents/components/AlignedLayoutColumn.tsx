import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveAlignedColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedColumnHighlights";

class AlignedLayoutColumn extends BaseLayoutComponent {
  static type: LayoutComponentTypes =
    LayoutComponentTypes.ALIGNED_LAYOUT_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveAlignedColumnHighlights;

  static getChildTemplate(props: LayoutProps): LayoutProps | null {
    if (props.childTemplate || props.childTemplate === null)
      return props.childTemplate;

    return {
      insertChild: true,
      layoutId: "",
      layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,
      layout: [],
    };
  }

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      direction: "column",
    };
  }
}

export default AlignedLayoutColumn;

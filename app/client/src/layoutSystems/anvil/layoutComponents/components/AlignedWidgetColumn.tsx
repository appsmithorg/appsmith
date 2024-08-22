import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { deriveAlignedColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedColumnHighlights";

import BaseLayoutComponent from "../BaseLayoutComponent";
import type { FlexLayoutProps } from "./FlexLayout";

class AlignedWidgetColumn extends BaseLayoutComponent {
  static type: LayoutComponentTypes =
    LayoutComponentTypes.ALIGNED_WIDGET_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveAlignedColumnHighlights;

  static rendersWidgets: boolean = true;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      direction: "column",
    };
  }
}

export default AlignedWidgetColumn;

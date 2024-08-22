import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";

import BaseLayoutComponent from "../BaseLayoutComponent";
import type { FlexLayoutProps } from "./FlexLayout";

class WidgetColumn extends BaseLayoutComponent {
  static type: LayoutComponentTypes = LayoutComponentTypes.WIDGET_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveColumnHighlights;

  static rendersWidgets: boolean = true;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      direction: "column",
    };
  }
}

export default WidgetColumn;

import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { deriveRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/rowHighlights";

import BaseLayoutComponent from "../BaseLayoutComponent";
import type { FlexLayoutProps } from "./FlexLayout";

class WidgetRow extends BaseLayoutComponent {
  static type: LayoutComponentTypes = LayoutComponentTypes.WIDGET_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveRowHighlights;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "row",
      wrap: "wrap",
    };
  }

  static rendersWidgets: boolean = true;
}

export default WidgetRow;

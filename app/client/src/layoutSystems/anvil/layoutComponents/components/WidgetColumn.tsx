import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";

class WidgetColumn extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

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

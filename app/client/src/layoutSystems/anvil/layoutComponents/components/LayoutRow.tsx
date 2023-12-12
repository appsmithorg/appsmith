import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/rowHighlights";

class LayoutRow extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.LAYOUT_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveRowHighlights;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "row",
    };
  }
}

export default LayoutRow;

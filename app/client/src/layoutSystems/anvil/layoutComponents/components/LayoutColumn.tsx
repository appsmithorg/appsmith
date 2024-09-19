import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";

class LayoutColumn extends BaseLayoutComponent {
  static type: LayoutComponentTypes = LayoutComponentTypes.LAYOUT_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveColumnHighlights;

  static getChildTemplate(props: LayoutProps): LayoutProps | null {
    if (props.childTemplate || props.childTemplate === null)
      return props.childTemplate;

    return {
      insertChild: true,
      layoutId: "",
      layoutType: LayoutComponentTypes.WIDGET_ROW,
      layout: [],
    };
  }

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "column",
    };
  }
}

export default LayoutColumn;

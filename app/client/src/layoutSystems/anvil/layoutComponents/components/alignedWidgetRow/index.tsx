import React from "react";
import BaseLayoutComponent from "../../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "../FlexLayout";
import { deriveAlignedRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedRowHighlights";
import AlignedWidgetRowComp from "./AlignedWidgetRowComp";

class AlignedWidgetRow extends BaseLayoutComponent {
  static type: LayoutComponentTypes = LayoutComponentTypes.ALIGNED_WIDGET_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveAlignedRowHighlights;

  renderChildWidgets(): React.ReactNode {
    return <AlignedWidgetRowComp {...this.props} />;
  }

  static rendersWidgets: boolean = true;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "row",
      wrap: "wrap",
      className: "aligned-widget-row",
    };
  }
}

export default AlignedWidgetRow;

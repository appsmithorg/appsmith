import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveAlignedRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedRowHighlights";
import { renderWidgetsInAlignedRow } from "layoutSystems/anvil/utils/layouts/renderUtils";

class AlignedWidgetRow extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.ALIGNED_WIDGET_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveAlignedRowHighlights;

  renderChildWidgets(): React.ReactNode {
    return renderWidgetsInAlignedRow(this.props);
  }

  static rendersWidgets: boolean = true;

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "row",
      wrap: "wrap",
    };
  }
}

export default AlignedWidgetRow;

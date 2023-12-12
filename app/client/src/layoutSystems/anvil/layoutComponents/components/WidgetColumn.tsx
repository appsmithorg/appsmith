import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";

class WidgetColumn extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

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

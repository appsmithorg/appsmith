import React from "react";
import { deriveAlignedColumnHighlights } from "../../utils/layouts/highlights/alignedColumnHighlights";
import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import type { FlexLayoutProps } from "./FlexLayout";
import { MainCanvasWrapper } from "./MainCanvasWrapper";

class LayoutColumn extends BaseLayoutComponent {
  static type: LayoutComponentTypes = LayoutComponentTypes.LAYOUT_COLUMN;

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
      height: "100%",
      gap: "spacing-4",
      direction: "column",
    };
  }

  renderViewMode(): JSX.Element {
    return (
      <MainCanvasWrapper {...this.getFlexLayoutProps()}>
        {super.renderChildren()}
      </MainCanvasWrapper>
    );
  }
}

export default LayoutColumn;

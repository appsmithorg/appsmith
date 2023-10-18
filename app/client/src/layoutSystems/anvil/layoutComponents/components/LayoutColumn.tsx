import React from "react";

import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  DeriveHighlightsFn,
  LayoutComponentProps,
  LayoutComponentTypes,
  LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "./FlexLayout";
import { deriveColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/columnHighlights";

class LayoutColumn extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.LAYOUT_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveColumnHighlights;

  static getChildTemplate(props: LayoutProps): LayoutProps | undefined {
    if (props.childTemplate) return props.childTemplate;
    return {
      insertChild: true,
      layoutId: "",
      layoutType: LayoutComponentTypes.WIDGET_ROW,
      layout: [],
    };
  }

  render() {
    const { canvasId, isDropTarget, layoutId, layoutStyle, renderMode } =
      this.props;

    return (
      <FlexLayout
        canvasId={canvasId}
        direction="column"
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        renderMode={renderMode}
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArea()}
        {this.renderChildLayouts()}
      </FlexLayout>
    );
  }
}

export default LayoutColumn;

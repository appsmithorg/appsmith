import React from "react";

import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "./FlexLayout";
import { deriveRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/rowHighlights";

class LayoutRow extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.LAYOUT_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveRowHighlights;

  render() {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutIndex,
      layoutStyle,
      renderMode,
    } = this.props;

    return (
      <FlexLayout
        alignSelf="stretch"
        canvasId={canvasId}
        columnGap="4px"
        direction="row"
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        layoutIndex={layoutIndex}
        renderMode={renderMode}
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildLayouts()}
      </FlexLayout>
    );
  }
}

export default LayoutRow;

import React from "react";

import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "./FlexLayout";
import { deriveAlignedColumnHighlights } from "layoutSystems/anvil/utils/layouts/highlights/alignedColumnHighlights";
import BaseLayoutComponent from "../BaseLayoutComponent";

class AlignedWidgetColumn extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

  static type: LayoutComponentTypes =
    LayoutComponentTypes.ALIGNED_WIDGET_COLUMN;

  static deriveHighlights: DeriveHighlightsFn = deriveAlignedColumnHighlights;

  static rendersWidgets: boolean = true;

  render() {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutIndex,
      layoutStyle,
      layoutType,
      parentDropTarget,
      renderMode,
    } = this.props;

    return (
      <FlexLayout
        canvasId={canvasId}
        direction="column"
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        layoutIndex={layoutIndex}
        layoutType={layoutType}
        parentDropTarget={parentDropTarget}
        renderMode={renderMode}
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildWidgets()}
      </FlexLayout>
    );
  }
}

export default AlignedWidgetColumn;

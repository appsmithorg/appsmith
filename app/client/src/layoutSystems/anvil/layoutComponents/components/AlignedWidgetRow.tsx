import React from "react";

import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "./FlexLayout";
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

  render() {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutIndex,
      layoutStyle,
      parentDropTarget,
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
        parentDropTarget={parentDropTarget}
        renderMode={renderMode}
        wrap="wrap"
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildWidgets()}
      </FlexLayout>
    );
  }
}

export default AlignedWidgetRow;

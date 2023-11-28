import React from "react";

import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
  type LayoutProps,
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
        canvasId={canvasId}
        direction="column"
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        layoutIndex={layoutIndex}
        parentDropTarget={parentDropTarget}
        renderMode={renderMode}
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildLayouts()}
      </FlexLayout>
    );
  }
}

export default AlignedWidgetColumn;

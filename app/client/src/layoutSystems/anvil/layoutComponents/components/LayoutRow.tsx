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
      isContainer,
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
        alignSelf="stretch"
        canvasId={canvasId}
        direction="row"
        isContainer={!!isContainer}
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        layoutIndex={layoutIndex}
        layoutType={layoutType}
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

export default LayoutRow;

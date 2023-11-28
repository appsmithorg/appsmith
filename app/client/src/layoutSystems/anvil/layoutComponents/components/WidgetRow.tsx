import React from "react";

import BaseLayoutComponent from "../BaseLayoutComponent";
import {
  type DeriveHighlightsFn,
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayout } from "./FlexLayout";
import { deriveRowHighlights } from "layoutSystems/anvil/utils/layouts/highlights/rowHighlights";

class WidgetRow extends BaseLayoutComponent {
  constructor(props: LayoutComponentProps) {
    super(props);
    this.state = {
      order: [...props.layoutOrder, props.layoutId],
    };
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.WIDGET_ROW;

  static deriveHighlights: DeriveHighlightsFn = deriveRowHighlights;

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
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildWidgets()}
      </FlexLayout>
    );
  }
}

export default WidgetRow;

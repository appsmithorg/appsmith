import { RenderModes } from "constants/WidgetConstants";
import type {
  LayoutComponentProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import WidgetRow from "../WidgetRow";
import { SectionSpaceDistributor } from "layoutSystems/anvil/sectionSpaceDistributor/SectionSpaceDistributor";

class SectionWidgetRow extends WidgetRow {
  renderSectionSpaceDistributor() {
    return (
      <SectionSpaceDistributor
        sectionLayoutId={this.props.layoutId}
        sectionWidgetId={this.props.canvasId}
        zones={this.props.layout as WidgetLayoutProps[]}
      />
    );
  }
  renderDraggingArena(): React.ReactNode {
    return (
      <>
        {super.renderDraggingArena()}
        {this.renderSectionSpaceDistributor()}
      </>
    );
  }
}

export const SectionRow = (props: LayoutComponentProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <SectionWidgetRow
      {...props}
      layoutStyle={{
        ...(props.layoutStyle || {}),
        wrap:
          !isPreviewMode && props.renderMode === RenderModes.CANVAS
            ? "nowrap"
            : "wrap",
      }}
    />
  );
};

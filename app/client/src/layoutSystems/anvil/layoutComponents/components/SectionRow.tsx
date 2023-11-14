import { RenderModes } from "constants/WidgetConstants";
import type { LayoutComponentProps } from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import AlignedWidgetRow from "./AlignedWidgetRow";
import WidgetRow from "./WidgetRow";

export const SectionRow = (props: LayoutComponentProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  if (!isPreviewMode && props.renderMode === RenderModes.CANVAS) {
    return <WidgetRow {...props} />;
  } else {
    return <AlignedWidgetRow {...props} />;
  }
};

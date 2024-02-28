import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";
import { getCanvasPreviewMode } from "selectors/ideSelectors";

export const SectionRow = (props: FlexLayoutProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  const isCanvasPreviewMode = useSelector(getCanvasPreviewMode);
  return (
    <FlexLayout
      {...props}
      wrap={
        !isPreviewMode &&
        !isCanvasPreviewMode &&
        props.renderMode === RenderModes.CANVAS
          ? "nowrap"
          : "wrap"
      }
    >
      {props.children}
    </FlexLayout>
  );
};

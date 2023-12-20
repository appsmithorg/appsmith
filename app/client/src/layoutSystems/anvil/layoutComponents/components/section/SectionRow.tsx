import { RenderModes } from "constants/WidgetConstants";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";

export const SectionRow = (props: FlexLayoutProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <FlexLayout
      {...props}
      wrap={
        !isPreviewMode && props.renderMode === RenderModes.CANVAS
          ? "nowrap"
          : "wrap"
      }
    >
      {props.children}
    </FlexLayout>
  );
};

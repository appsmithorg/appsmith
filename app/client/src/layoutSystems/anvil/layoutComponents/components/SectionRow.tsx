import { RenderModes } from "constants/WidgetConstants";
import type { LayoutComponentProps } from "layoutSystems/anvil/utils/anvilTypes";
import React from "react";
import { useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";
import WidgetRow from "./WidgetRow";

export const SectionRow = (props: LayoutComponentProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  return (
    <WidgetRow
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

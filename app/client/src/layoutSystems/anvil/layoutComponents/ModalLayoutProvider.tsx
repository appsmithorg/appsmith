import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { LayoutProvider } from "./LayoutProvider";
import React from "react";
import { previewModeSelector } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { EmptyModalDropArena } from "../editor/canvasArenas/EmptyModalDropArena";

export const ModalLayoutProvider = (props: BaseWidgetProps) => {
  const isPreviewMode = useSelector(previewModeSelector);
  const showEmptyModalDropArena =
    props.renderMode === "CANVAS" && !isPreviewMode;
  if (showEmptyModalDropArena) {
    return (
      <EmptyModalDropArena
        canvasId={props.widgetId}
        layoutId={props.layout[0].layoutId}
      >
        <LayoutProvider {...props} />
      </EmptyModalDropArena>
    );
  }
  return <LayoutProvider {...props} />;
};

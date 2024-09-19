import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { LayoutProvider } from "./LayoutProvider";
import React from "react";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";
import { useSelector } from "react-redux";
import { AnvilModalDropArena } from "../editor/canvasArenas/AnvilModalDropArena";

export const ModalLayoutProvider = (props: BaseWidgetProps) => {
  const isEditOnlyMode = useSelector(isEditOnlyModeSelector);

  if (isEditOnlyMode) {
    return (
      <AnvilModalDropArena
        layoutId={props.layout[0].layoutId}
        modalId={props.widgetId}
      >
        <LayoutProvider {...props} />
      </AnvilModalDropArena>
    );
  }

  return <LayoutProvider {...props} />;
};

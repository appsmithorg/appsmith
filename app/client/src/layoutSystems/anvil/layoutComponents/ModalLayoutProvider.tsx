import React from "react";

import { useSelector } from "react-redux";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

import { AnvilModalDropArena } from "../editor/canvasArenas/AnvilModalDropArena";
import { LayoutProvider } from "./LayoutProvider";

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

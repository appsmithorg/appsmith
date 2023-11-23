import React, { useEffect } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getAnvilCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";
import { useDispatch } from "react-redux";
import { checkSectionAutoDeleteAction } from "../integrations/actions/sectionActions";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const dispatch = useDispatch();
  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });

  useEffect(() => {
    /**
     * If a canvas can not be empty,
     * then check if parent should be deleted.
     * This is done because SectionWidgets can not exist if they are empty.
     */
    if (props.deleteIfEmpty && !props.children?.length) {
      dispatch(checkSectionAutoDeleteAction(props.widgetId));
    }
  }, [props.children, props.deleteIfEmpty]);

  const className: string = `anvil-canvas ${props.classList?.join(" ")}`;
  return (
    <div className={className} id={getAnvilCanvasId(props.widgetId)}>
      {renderLayouts(
        props.layout,
        map,
        props.widgetId,
        "",
        props.renderMode || RenderModes.CANVAS,
        [],
      )}
    </div>
  );
};

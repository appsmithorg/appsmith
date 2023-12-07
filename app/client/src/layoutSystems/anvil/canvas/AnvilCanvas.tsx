import React, { useEffect } from "react";
import "./styles.css";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import type { LayoutComponentProps } from "../utils/anvilTypes";
import type { WidgetProps } from "widgets/BaseWidget";
import { renderLayouts } from "../utils/layouts/renderUtils";
import { getAnvilCanvasId } from "./utils";
import { RenderModes } from "constants/WidgetConstants";
import { useDispatch, useSelector } from "react-redux";
import {
  checkSectionAutoDeleteAction,
  checkSectionZoneCountAction,
} from "../integrations/actions/sectionActions";
import { isCanvasOfSection } from "selectors/widgetSelectors";
import { useClickToClearSelections } from "./useClickToClearSelections";

export const AnvilCanvas = (props: BaseWidgetProps) => {
  const dispatch = useDispatch();
  const hasSectionParent: boolean = useSelector(
    isCanvasOfSection(props.widgetId),
  );

  const map: LayoutComponentProps["childrenMap"] = {};
  props.children.forEach((child: WidgetProps) => {
    map[child.widgetId] = child;
  });

  useEffect(() => {
    /**
     * If canvas is not a child of a section, then return.
     */
    if (!hasSectionParent) return;
    /**
     * If a canvas can not be empty,
     * then check if parent should be deleted.
     * This is done because SectionWidgets can not exist if they are empty.
     */
    if (!props.children?.length) {
      dispatch(checkSectionAutoDeleteAction(props.widgetId));
    } else {
      /**
       * Number of child zones has changed.
       * Update parent's zoneCount if not matching.
       */
      dispatch(checkSectionZoneCountAction(props.widgetId));
    }
  }, [hasSectionParent, props.children]);

  const clickToClearSelections = useClickToClearSelections(props.widgetId);
  const className: string = `anvil-canvas ${props.classList?.join(" ")}`;
  return (
    <div
      className={className}
      id={getAnvilCanvasId(props.widgetId)}
      onClick={clickToClearSelections}
    >
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

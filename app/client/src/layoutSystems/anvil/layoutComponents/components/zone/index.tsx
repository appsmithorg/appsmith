import React from "react";
import {
  LayoutComponentTypes,
  type LayoutProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { isLargeWidget } from "layoutSystems/anvil/utils/widgetUtils";
import AlignedLayoutColumn from "../AlignedLayoutColumn";
import { ZoneColumn } from "./ZoneColumn";

class Zone extends AlignedLayoutColumn {
  static type: LayoutComponentTypes = LayoutComponentTypes.ZONE;

  static getChildTemplate(
    props: LayoutProps,
    widgets?: WidgetLayoutProps[],
  ): LayoutProps | null {
    if (props.childTemplate || props.childTemplate === null)
      return props.childTemplate;

    const defaultTemplate: LayoutProps = {
      insertChild: true,
      layoutId: "",
      layoutType: LayoutComponentTypes.ALIGNED_WIDGET_ROW,
      layout: [],
    };

    if (!widgets || !widgets?.length) return defaultTemplate;

    const hasLargeWidget = widgets.some((each: WidgetLayoutProps) => {
      return isLargeWidget(each.widgetType);
    });

    /**
     * 1. If a Row in a Zone renders a large widget,
     * then it can not render another widget. maxChildLimit = 1.
     *  1a. maxChildLimit = 0 => No limit.
     * 2. If it renders small widgets, then it can not render large widgets.
     * => allowedWidgetTypes = ["SMALL_WIDGETS"]
     */
    return {
      ...defaultTemplate,
      allowedWidgetTypes: hasLargeWidget ? [] : ["SMALL_WIDGETS"],
      maxChildLimit: hasLargeWidget ? 1 : 0,
    };
  }

  renderViewMode() {
    return (
      <ZoneColumn {...this.getFlexLayoutProps()}>
        {this.renderChildren()}
      </ZoneColumn>
    );
  }
}

export default Zone;

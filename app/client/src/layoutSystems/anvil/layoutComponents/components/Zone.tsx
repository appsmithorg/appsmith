import React from "react";
import AlignedLayoutColumn from "./AlignedLayoutColumn";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { isLargeWidget } from "layoutSystems/anvil/utils/layouts/widgetUtils";
import { FlexLayout } from "./FlexLayout";

class Zone extends AlignedLayoutColumn {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

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

  render() {
    const {
      canvasId,
      isDropTarget,
      layoutId,
      layoutIndex,
      layoutStyle,
      layoutType,
      renderMode,
    } = this.props;

    return (
      <FlexLayout
        alignSelf={"stretch"}
        canvasId={canvasId}
        direction="column"
        flexGrow={1}
        flexShrink={1}
        isDropTarget={!!isDropTarget}
        layoutId={layoutId}
        layoutIndex={layoutIndex}
        layoutType={layoutType}
        renderMode={renderMode}
        {...(layoutStyle || {})}
      >
        {this.renderDraggingArena()}
        {this.renderChildLayouts()}
      </FlexLayout>
    );
  }
}

export default Zone;

/**
 * MainCanvas childTemplate - SectionWidget
 *  SectionWidget
 *    SectionLayout (WidgetRow) - childTemplate - ZoneWidget
 *     ZoneWidget
 *       ZoneLayout - childTemplate - AlignedWidgetRow
 *        AlignedWidgetRow
 *         Button
 *
 *
 *
 * If a layout has a childTemplate && there are child widgets to be added to it.
 * => Create the childTemplate
 * => Else stick with the original layout.
 *
 * This needs to be done for widget add and move.
 */

/**
 * When dropping into a section
 * childTemplate - ZoneWidget
 *  create ZoneWidget
 *   create CanvasWidget
 *    check layout && childTemplate
 *     create AlignedWidgetRow
 *      check insertChild
 *       add widget
 */

/**
 * When dropping into main canvas layout
 * childTemplate - SectionWidget
 *   create SectionWidget
 *     create CanvasWidget
 *       check layout && childTemplate  - ZoneWidget || null
 *        create ZoneWidget
 *         create CanvasWidget
 *          check layout && childTemplate - AlignedWidgetRow
 *           check insertChild
 *            add widget
 */

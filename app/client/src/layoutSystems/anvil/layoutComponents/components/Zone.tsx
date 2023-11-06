import AlignedLayoutColumn from "./AlignedLayoutColumn";
import type {
  LayoutComponentProps,
  LayoutProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { LayoutComponentTypes } from "layoutSystems/anvil/utils/anvilTypes";
import { isLargeWidget } from "layoutSystems/anvil/utils/layouts/widgetUtils";

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
}

export default Zone;

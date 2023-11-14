import type {
  LayoutProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import {
  type LayoutComponentProps,
  LayoutComponentTypes,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetRow from "./WidgetRow";

class Section extends WidgetRow {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.SECTION;

  static getChildTemplate(
    props: LayoutProps,
    widgets: WidgetLayoutProps[],
  ): LayoutProps | null {
    if (props.childTemplate || props.childTemplate === null)
      return props.childTemplate;

    /**
     * TODO: replace this with zone widget.
     */
    const defaultTemplate: LayoutProps = {
      isDropTarget: true,
      isPermanent: false,
      layout: [],
      layoutId: "",
      layoutType: LayoutComponentTypes.ZONE,
      layoutStyle: {
        flexGrow: "inherit",
      },
    };

    if (!widgets || !widgets?.length) return defaultTemplate;

    const hasZoneWidget = widgets.some((each: WidgetLayoutProps) => {
      return each.widgetType === "ZONE_WIDGET";
    });

    /**
     * If the dragged widgets include a zone widget.
     * => a zone is being re-ordered.
     * => it can be added directly to the section and no template is required.
     */
    if (hasZoneWidget) return null;
    return defaultTemplate;
  }

  static getWhitelistedTypes(props: LayoutProps): string[] {
    if (props.allowedWidgetTypes && props.allowedWidgetTypes.length) {
      return props.allowedWidgetTypes;
    }
    return ["ZONE_WIDGET"];
  }

  static rendersWidgets: boolean = true;
}

export default Section;

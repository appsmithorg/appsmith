import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { WDSParagraphWidget } from "widgets/wds/WDSParagraphWidget";

class WDSHeadingWidget extends WDSParagraphWidget {
  static type = "WDS_HEADING_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.CONTENT],
      name: "Heading",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
    };
  }

  static getDefaults() {
    return {
      ...super.getDefaults(),
      fontSize: "heading",
      widgetName: "Heading",
      text: "Heading",
    };
  }
}

export { WDSHeadingWidget };

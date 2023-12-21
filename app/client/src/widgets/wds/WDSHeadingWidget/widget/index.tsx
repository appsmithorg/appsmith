import { WDSTextWidget } from "widgets/wds/WDSParagraphWidget";

class WDSHeadingWidget extends WDSTextWidget {
  static type = "WDS_HEADING_WIDGET";

  static getConfig() {
    return {
      ...super.getConfig(),
      name: "Heading",
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

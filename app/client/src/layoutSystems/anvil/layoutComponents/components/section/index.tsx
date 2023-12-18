import React from "react";
import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetRow from "../WidgetRow";
import { SectionRow } from "./SectionRow";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";

class Section extends WidgetRow {
  static type: LayoutComponentTypes = LayoutComponentTypes.SECTION;

  static getWhitelistedTypes(props: LayoutProps): string[] {
    if (props.allowedWidgetTypes && props.allowedWidgetTypes.length) {
      return props.allowedWidgetTypes;
    }
    // TODO: remove string hard coding.
    return [ZoneWidget.type];
  }

  render(): JSX.Element {
    return <SectionRow {...this.props}>{this.renderContent()}</SectionRow>;
  }
}

export default Section;

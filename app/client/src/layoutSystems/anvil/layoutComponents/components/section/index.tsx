import React from "react";
import {
  type LayoutComponentProps,
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetRow from "../WidgetRow";
import { SectionRow } from "./SectionRow";

class Section extends WidgetRow {
  constructor(props: LayoutComponentProps) {
    super(props);
  }

  static type: LayoutComponentTypes = LayoutComponentTypes.SECTION;

  static getWhitelistedTypes(props: LayoutProps): string[] {
    if (props.allowedWidgetTypes && props.allowedWidgetTypes.length) {
      return props.allowedWidgetTypes;
    }
    // TODO: remove string hard coding.
    return ["ZONE_WIDGET"];
  }

  render(): JSX.Element {
    return <SectionRow {...this.props}>{this.renderContent()}</SectionRow>;
  }
}

export default Section;

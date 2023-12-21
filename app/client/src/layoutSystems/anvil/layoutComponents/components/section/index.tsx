import React from "react";
import {
  LayoutComponentTypes,
  type LayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetRow from "../WidgetRow";
import { SectionRow } from "./SectionRow";
import type { FlexLayoutProps } from "../FlexLayout";
import { anvilWidgets } from "widgets/anvil/constants";

class Section extends WidgetRow {
  static type: LayoutComponentTypes = LayoutComponentTypes.SECTION;

  static getWhitelistedTypes(props: LayoutProps): string[] {
    if (props.allowedWidgetTypes && props.allowedWidgetTypes.length) {
      return props.allowedWidgetTypes;
    }
    // TODO: remove string hard coding.
    return [anvilWidgets.ZONE_WIDGET];
  }

  getFlexLayoutProps(): Omit<FlexLayoutProps, "children"> {
    return {
      ...super.getFlexLayoutProps(),
      alignSelf: "stretch",
      direction: "row",
    };
  }

  render(): JSX.Element {
    return (
      <SectionRow {...this.getFlexLayoutProps()}>
        {this.renderContent()}
      </SectionRow>
    );
  }
}

export default Section;

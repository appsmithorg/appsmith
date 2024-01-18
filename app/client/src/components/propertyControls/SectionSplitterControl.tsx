import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { SectionSplitterComponent } from "layoutSystems/anvil/sectionSpaceDistributor/propertyPane/SectionSplitterComponent";

export interface SectionSplitterControlProps extends ControlProps {}

export class SectionSplitterControl extends BaseControl<SectionSplitterControlProps> {
  static getControlType() {
    return "SECTION_SPLITTER";
  }
  render() {
    return (
      <SectionSplitterComponent
        sectionWidgetId={this.props.widgetProperties.widgetId}
      />
    );
  }
}

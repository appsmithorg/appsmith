import React from "react";

import { PropertyPaneSectionSpaceDistributor } from "layoutSystems/anvil/sectionSpaceDistributor/propertyPane/PropertyPaneSectionSpaceDistributor";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

export interface SectionSplitterControlProps extends ControlProps {}

export class SectionSplitterControl extends BaseControl<SectionSplitterControlProps> {
  static getControlType() {
    return "SECTION_SPLITTER";
  }
  render() {
    return (
      <PropertyPaneSectionSpaceDistributor
        sectionWidgetId={this.props.propertyValue}
      />
    );
  }
}

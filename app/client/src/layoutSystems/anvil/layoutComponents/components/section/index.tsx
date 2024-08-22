import React from "react";

import { SectionSpaceDistributor } from "layoutSystems/anvil/sectionSpaceDistributor/SectionSpaceDistributor";
import {
  LayoutComponentTypes,
  type LayoutProps,
  type WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { anvilWidgets } from "widgets/anvil/constants";

import type { FlexLayoutProps } from "../FlexLayout";
import WidgetRow from "../WidgetRow";
import { SectionRow } from "./SectionRow";

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
      gap: "spacing-4",
    };
  }

  renderSectionSpaceDistributor() {
    return (
      <SectionSpaceDistributor
        sectionLayoutId={this.props.layoutId}
        sectionWidgetId={this.props.canvasId}
        zones={this.props.layout as WidgetLayoutProps[]}
      />
    );
  }

  renderEditMode(): JSX.Element {
    return (
      <>
        {this.renderDraggingArena()}
        {this.renderSpaceDistributedSection()}
      </>
    );
  }
  renderSpaceDistributedSection(): JSX.Element {
    return (
      <SectionRow {...this.getFlexLayoutProps()}>
        {this.renderSectionSpaceDistributor()}
        {super.renderChildren()}
      </SectionRow>
    );
  }

  renderViewMode(): JSX.Element {
    return (
      <SectionRow {...this.getFlexLayoutProps()}>
        {super.renderChildren()}
      </SectionRow>
    );
  }
}

export default Section;

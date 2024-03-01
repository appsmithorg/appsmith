import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import AlignedLayoutColumn from "layoutSystems/anvil/layoutComponents/components/AlignedLayoutColumn";
import AlignedWidgetColumn from "layoutSystems/anvil/layoutComponents/components/AlignedWidgetColumn";
import LayoutColumn from "layoutSystems/anvil/layoutComponents/components/LayoutColumn";
import LayoutRow from "layoutSystems/anvil/layoutComponents/components/LayoutRow";
import WidgetColumn from "layoutSystems/anvil/layoutComponents/components/WidgetColumn";
import WidgetRow from "layoutSystems/anvil/layoutComponents/components/WidgetRow";
import AlignedWidgetRow from "layoutSystems/anvil/layoutComponents/components/alignedWidgetRow";
import Section from "layoutSystems/anvil/layoutComponents/components/section";
import Zone from "layoutSystems/anvil/layoutComponents/components/zone";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { AlignmentIndexMap } from "../constants";

const layoutComponents = [
  AlignedLayoutColumn,
  AlignedWidgetColumn,
  AlignedWidgetRow,
  LayoutColumn,
  LayoutRow,
  Section,
  WidgetColumn,
  WidgetRow,
  Zone,
];

export function registerLayoutComponents() {
  LayoutFactory.initialize(layoutComponents);
}

export function getAlignmentLayoutId(
  layoutId: string,
  alignment: FlexLayerAlignment,
): string {
  return `${layoutId}-${AlignmentIndexMap[alignment]}`;
}

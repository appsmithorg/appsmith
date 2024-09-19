import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { isWidgetLayoutProps } from "./typeUtils";
import type { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { AlignmentIndexMap } from "../constants";
import AlignedLayoutColumn from "layoutSystems/anvil/layoutComponents/components/AlignedLayoutColumn";
import AlignedWidgetColumn from "layoutSystems/anvil/layoutComponents/components/AlignedWidgetColumn";
import AlignedWidgetRow from "layoutSystems/anvil/layoutComponents/components/alignedWidgetRow";
import LayoutColumn from "layoutSystems/anvil/layoutComponents/components/LayoutColumn";
import LayoutRow from "layoutSystems/anvil/layoutComponents/components/LayoutRow";
import WidgetColumn from "layoutSystems/anvil/layoutComponents/components/WidgetColumn";
import WidgetRow from "layoutSystems/anvil/layoutComponents/components/WidgetRow";
import Section from "layoutSystems/anvil/layoutComponents/components/section";
import Zone from "layoutSystems/anvil/layoutComponents/components/zone";

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

/**
 * Update a layout component by adding supplied list of widgets / layouts to it.
 * @param props | LayoutProps - Parent Layout.
 * @param children | WidgetLayoutProps[] | LayoutProps[] - List of child widgets or layouts to be added to the parent layout.
 * @param highlight | HighlightInfo - Drop Information.
 * @returns LayoutProps
 */
export function addChildToLayout(
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps {
  const layout: WidgetLayoutProps[] | LayoutProps[] = props.layout;
  const { rowIndex: index } = highlight;

  return {
    ...props,
    layout: [...layout.slice(0, index), ...children, ...layout.slice(index)] as
      | LayoutProps[]
      | WidgetLayoutProps[],
  };
}

/**
 * Update a layout by removing children at a specified index.
 * return undefined if layout is not permanent and is empty after deletion.
 * @param props | LayoutProps - Parent Layout.
 * @param child | WidgetLayoutProps | LayoutProps - Child (widget / layout) to be removed.
 * @returns LayoutProps | undefined
 */
export function removeChildFromLayout(
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined {
  if (!child) return props;

  let updatedLayout: LayoutProps = { ...props };

  if (isWidgetLayoutProps(child)) {
    updatedLayout = {
      ...props,
      layout: (props.layout as WidgetLayoutProps[]).filter(
        (each: WidgetLayoutProps) =>
          each.widgetId !== (child as WidgetLayoutProps).widgetId,
      ),
    };
  } else {
    updatedLayout = {
      ...props,
      layout: (props.layout as LayoutProps[]).filter(
        (each: LayoutProps) =>
          each.layoutId !== (child as LayoutProps).layoutId,
      ),
    };
  }

  return updatedLayout.isPermanent || updatedLayout.layout?.length
    ? updatedLayout
    : undefined;
}

export function extractWidgetIdsFromLayoutProps(props: LayoutProps): string[] {
  if (!props || !props.layout.length) return [];

  return (props.layout as WidgetLayoutProps[]).map(
    (each: WidgetLayoutProps) => each.widgetId,
  );
}

export function getAlignmentLayoutId(
  layoutId: string,
  alignment: FlexLayerAlignment,
): string {
  return `${layoutId}-${AlignmentIndexMap[alignment]}`;
}

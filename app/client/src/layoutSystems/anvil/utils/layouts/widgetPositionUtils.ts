import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import type { LayoutProps, WidgetLayoutProps } from "../anvilTypes";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";

export interface WidgetLayoutPositionInfo {
  layoutOrder: string[];
  rowIndex: number;
  widgetLayoutProps: WidgetLayoutProps;
}

export function getWidgetLayoutMetaInfo(
  parentLayout: LayoutProps | null,
  widgetId: string,
  layoutOrder: string[] = [],
): WidgetLayoutPositionInfo | null {
  if (!parentLayout) return null;

  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
    parentLayout.layoutType,
  );

  if (Comp.rendersWidgets) {
    return findInWidgetLayout(parentLayout, widgetId, layoutOrder);
  }

  return findInLayout(parentLayout, widgetId, layoutOrder);
}

function findInWidgetLayout(
  parentLayout: LayoutProps,
  widgetId: string,
  order: string[] = [],
): WidgetLayoutPositionInfo | null {
  const widgetLayouts: WidgetLayoutProps[] =
    parentLayout.layout as WidgetLayoutProps[];
  const index: number = getWidgetIndex(parentLayout, widgetId);

  if (index === -1) return null;

  return {
    layoutOrder: [...order, parentLayout.layoutId],
    rowIndex: index,
    widgetLayoutProps: widgetLayouts[index],
  };
}

function findInLayout(
  parentLayout: LayoutProps,
  widgetId: string,
  order: string[] = [],
): WidgetLayoutPositionInfo | null {
  const layouts: LayoutProps[] = parentLayout.layout as LayoutProps[];
  let res: WidgetLayoutPositionInfo | null = null;

  for (let i = 0; i < layouts.length; i += 1) {
    const each: LayoutProps = layouts[i];
    let temp: WidgetLayoutPositionInfo | null = null;
    const Comp: typeof BaseLayoutComponent = LayoutFactory.get(each.layoutType);

    if (Comp.rendersWidgets) {
      temp = findInWidgetLayout(each, widgetId, [
        ...order,
        parentLayout.layoutId,
      ]);
    } else {
      temp = findInLayout(each, widgetId, [...order, parentLayout.layoutId]);
    }

    if (!!temp) {
      res = temp;
      break;
    }
  }

  return res;
}

function getWidgetIndex(props: LayoutProps, widgetId: string): number {
  const widgetLayouts: WidgetLayoutProps[] =
    props.layout as WidgetLayoutProps[];

  return widgetLayouts.findIndex(
    (item: WidgetLayoutProps) => item.widgetId === widgetId,
  );
}

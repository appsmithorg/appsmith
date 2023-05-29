import WidgetFactory from "utils/WidgetFactory";
import { FlexLayerAlignment, ResponsiveBehavior } from "./constants";
import type { ReactNode } from "react";
import type {
  FlexLayer,
  FlexLayerLayoutData,
  LayerChild,
} from "./autoLayoutTypes";

export function getIsFillWidgetFromType(type: string): boolean {
  if (!type) return false;
  const widgetConfig = WidgetFactory.widgetConfigMap.get(type);
  return widgetConfig?.responsiveBehavior === ResponsiveBehavior.Fill;
}

export function splitChildrenIntoFlexLayers(
  children: { [id: string]: any },
  flexLayers: FlexLayer[],
): FlexLayerLayoutData[] {
  if (!children || !flexLayers) return [];

  return flexLayers.map((layer: FlexLayer) =>
    getLayoutDataForFlexLayer(children, layer),
  );
}

export function getLayoutDataForFlexLayer(
  children: { [id: string]: any },
  layer: FlexLayer,
): FlexLayerLayoutData {
  const startChildren: ReactNode[] = [];
  const centerChildren: ReactNode[] = [];
  const endChildren: ReactNode[] = [];
  let hasFillWidget = false;
  layer.children.forEach((child: LayerChild) => {
    if (!children[child.id]) return;
    const widget: JSX.Element = children[child.id];
    hasFillWidget =
      hasFillWidget ||
      getIsFillWidgetFromType((widget as JSX.Element).props?.type);
    if (child.align === FlexLayerAlignment.Start) {
      startChildren.push(children[child.id]);
    } else if (child.align === FlexLayerAlignment.Center) {
      centerChildren.push(children[child.id]);
    } else if (child.align === FlexLayerAlignment.End) {
      endChildren.push(children[child.id]);
    }
  });
  if (hasFillWidget)
    return {
      centerChildren: [],
      endChildren: [],
      hasFillWidget: true,
      startChildren: [...startChildren, ...centerChildren, ...endChildren],
    };
  return {
    centerChildren,
    endChildren,
    hasFillWidget: false,
    startChildren,
  };
}

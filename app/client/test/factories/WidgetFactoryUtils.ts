import { makeFactory } from "factory.ts";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DSLWidget } from "WidgetProvider/constants";
import defaultTemplate from "templates/default";
import { WidgetTypeFactories } from "./Widgets/WidgetTypeFactories";
const defaultMainContainer: DSLWidget = {
  ...(defaultTemplate as unknown as DSLWidget),
  canExtend: true,
  renderMode: "PAGE",
  version: 1,
  isLoading: false,
} as DSLWidget;

export const mainContainerFactory = makeFactory({ ...defaultMainContainer });
export const widgetCanvasFactory = makeFactory(mainContainerFactory.build());
const buildChild = (child: Partial<WidgetProps>): WidgetProps => {
  return WidgetTypeFactories[child.type || "CANVAS_WIDGET"].build({
    ...child,
  });
};

export const buildChildren = (children: Partial<WidgetProps>[]) => {
  try {
    return children.map((child) => {
      return buildChild(child);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Check if child widget data provided");
  }
};

export const buildDslWithChildren = (childData: Partial<WidgetProps>[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any = buildChildren(childData);

  return widgetCanvasFactory.build({
    children,
  });
};

import { makeFactory } from "factory.ts";
import { WidgetProps } from "widgets/BaseWidget";
import { DSLWidget } from "widgets/constants";
import defaultTemplate from "../../src/templates/default";
import { WidgetTypeFactories } from "./Widgets/WidgetTypeFactories";
const defaultMainContainer: DSLWidget = {
  ...(defaultTemplate as any),
  canExtend: true,
  renderMode: "PAGE",
  version: 1,
  isLoading: false,
};

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
    console.error("Check if child widget data provided");
  }
};

export const buildDslWithChildren = (childData: Partial<WidgetProps>[]) => {
  const children: any = buildChildren(childData);
  return widgetCanvasFactory.build({
    children,
  });
};

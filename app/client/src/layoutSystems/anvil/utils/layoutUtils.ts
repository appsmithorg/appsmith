import LayoutFactory from "../layoutComponents/LayoutFactory";
import Row from "../layoutComponents/Row";

const layoutComponents = [Row];

export function registerLayoutComponents() {
  LayoutFactory.initialize(layoutComponents);
}

export function getLayoutClassName(canvasId: string, layoutId: string): string {
  return `layout-${canvasId}-${layoutId}`;
}

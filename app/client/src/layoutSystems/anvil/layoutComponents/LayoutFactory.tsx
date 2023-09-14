import type { LayoutComponent, LayoutComponentType } from "../utils/anvilTypes";
import { LayoutComponentHOC } from "./LayoutComponetsHOC";

class LayoutFactory {
  static layoutsMap: Map<LayoutComponentType, LayoutComponent> = new Map();

  static initialize(layoutComponents: LayoutComponent[]) {
    layoutComponents.forEach((layoutComponent) => {
      const WrappedLayoutComponent = LayoutComponentHOC(layoutComponent);
      this.layoutsMap.set(
        layoutComponent.type,
        WrappedLayoutComponent as LayoutComponent,
      );
    });
  }

  static get(type: LayoutComponentType) {
    if (LayoutFactory.layoutsMap.size === 0) {
      throw new Error(
        "LayoutFactory is not initialized. Call LayoutFactory.initialize() before using it",
      );
    }

    const layout = LayoutFactory.layoutsMap.get(type);

    if (layout) {
      return layout;
    } else {
      throw new Error(`LayoutComponent with the type "${type}" is not defined`);
    }
  }
}

export default LayoutFactory;

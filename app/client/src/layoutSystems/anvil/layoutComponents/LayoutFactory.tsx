import type {
  DeriveHighlightsFn,
  LayoutComponentTypes,
} from "../utils/anvilTypes";
import type BaseLayoutComponent from "./BaseLayoutComponent";

class LayoutFactory {
  static layoutsMap: Map<LayoutComponentTypes, typeof BaseLayoutComponent> =
    new Map();

  static initialize(layoutComponents: (typeof BaseLayoutComponent)[]) {
    layoutComponents.forEach((layoutComponent: typeof BaseLayoutComponent) => {
      this.layoutsMap.set(
        layoutComponent.type,
        layoutComponent as typeof BaseLayoutComponent,
      );
    });
  }

  static get(type: LayoutComponentTypes) {
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

  static getDeriveHighlightsFn(type: LayoutComponentTypes): DeriveHighlightsFn {
    const Comp: typeof BaseLayoutComponent = LayoutFactory.get(type);

    if (!Comp) throw Error(`LayoutComponent with the type "${type}" not found`);

    return Comp.deriveHighlights;
  }

  static doesLayoutRenderWidgets(type: LayoutComponentTypes): boolean {
    const Comp: typeof BaseLayoutComponent = LayoutFactory.get(type);

    if (!Comp) throw Error(`LayoutComponent with the type "${type}" not found`);

    return Comp.rendersWidgets;
  }
}

export default LayoutFactory;

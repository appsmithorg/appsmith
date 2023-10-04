import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type { LayoutComponent, LayoutComponentProps } from "../../anvilTypes";

export function deleteWidgetFromPreset(
  preset: LayoutComponentProps[],
  widgetId: string,
): LayoutComponentProps[] {
  if (!preset || !preset.length || !widgetId) return preset;

  const updatedPreset: LayoutComponentProps[] = preset.map(
    (each: LayoutComponentProps) => {
      return (
        deleteWidgetFromLayout(each, widgetId) || ({} as LayoutComponentProps)
      );
    },
  );

  return updatedPreset.filter((each: LayoutComponentProps) => !!each.layout);
}

/**
 * Update a layout by deleting a widget.
 * 1. Parse the layout and its nested layouts until the widgetId is found.
 * 2. Delete the widgetId from the immediate parent layout.
 * 3. If the immediate parent layout is empty and it is not a permanent layout, delete the parent layout from it's parent.
 * 4. Recursively traverse back to the top most layout, removing any layout that is empty and not permanent.
 * @param layout | LayoutComponentProps : Layout to be updated.
 * @param widgetId | string: widget id.
 * @returns : LayoutComponentProps
 */
export function deleteWidgetFromLayout(
  layoutProps: LayoutComponentProps,
  widgetId: string,
): LayoutComponentProps | undefined {
  if (!widgetId) return layoutProps;

  const Comp: LayoutComponent = LayoutFactory.get(layoutProps.layoutType);

  if (Comp.rendersWidgets(layoutProps)) {
    if (!Comp.extractChildWidgetIds(layoutProps).includes(widgetId)) {
      return layoutProps;
    }
    return Comp.removeChild(layoutProps, widgetId);
  }

  const updatedLayout: LayoutComponentProps = {
    ...layoutProps,
    layout: (layoutProps.layout as LayoutComponentProps[])
      .map(
        (each: LayoutComponentProps) =>
          deleteWidgetFromLayout(each, widgetId) ||
          ({} as LayoutComponentProps),
      )
      .filter((each: LayoutComponentProps) => Object.keys(each).length),
  };

  return updatedLayout.isPermanent || updatedLayout.layout?.length
    ? updatedLayout
    : undefined;
}

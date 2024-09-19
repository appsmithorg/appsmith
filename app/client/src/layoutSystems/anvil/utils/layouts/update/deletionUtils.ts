import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type { LayoutProps } from "../../anvilTypes";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";

export function deleteWidgetFromPreset(
  preset: LayoutProps[],
  widgetId: string,
  widgetType: string,
): LayoutProps[] {
  if (!preset || !preset.length || !widgetId) return preset;

  const updatedPreset: LayoutProps[] = preset.map((each: LayoutProps) => {
    return (
      deleteWidgetFromLayout(each, widgetId, widgetType) || ({} as LayoutProps)
    );
  });

  return updatedPreset.filter((each: LayoutProps) => !!each.layout);
}

/**
 * Update a layout by deleting a widget.
 * 1. Parse the layout and its nested layouts until the widgetId is found.
 * 2. Delete the widgetId from the immediate parent layout.
 * 3. If the immediate parent layout is empty and it is not a permanent layout, delete the parent layout from it's parent.
 * 4. Recursively traverse back to the top most layout, removing any layout that is empty and not permanent.
 * @param layout | LayoutProps : Layout to be updated.
 * @param widgetId | string: widget id.
 * @param widgetType | string: widget type.
 * @returns : LayoutProps
 */
export function deleteWidgetFromLayout(
  layoutProps: LayoutProps,
  widgetId: string,
  widgetType: string,
): LayoutProps | undefined {
  if (!widgetId) return layoutProps;

  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
    layoutProps.layoutType,
  );

  if (Comp.rendersWidgets) {
    if (!Comp.extractChildWidgetIds(layoutProps).includes(widgetId)) {
      return layoutProps;
    }

    return Comp.removeChild(layoutProps, {
      alignment: FlexLayerAlignment.Start,
      widgetId,
      widgetType,
    });
  }

  const updatedLayout: LayoutProps = {
    ...layoutProps,
    layout: (layoutProps.layout as LayoutProps[])
      .map(
        (each: LayoutProps) =>
          deleteWidgetFromLayout(each, widgetId, widgetType) ||
          ({} as LayoutProps),
      )
      .filter((each: LayoutProps) => Object.keys(each).length),
  };

  return updatedLayout.isPermanent || updatedLayout.layout?.length
    ? updatedLayout
    : undefined;
}

/**
 * Update layout of a canvas widget after a widget is deleted.
 * @param allWidgets | CanvasWidgetsReduxState : all widgets.
 * @param parentId | string : id of canvas widget to be updated.
 * @param widgetId | string : id of widget that is deleted.
 * @param widgetType | string : type of widget that is deleted.
 * @returns CanvasWidgetsReduxState
 */
export function updateAnvilParentPostWidgetDeletion(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  widgetId: string,
  widgetType: string,
): CanvasWidgetsReduxState {
  if (!parentId || !widgetId || !allWidgets[parentId]) return allWidgets;

  return {
    ...allWidgets,
    [parentId]: {
      ...allWidgets[parentId],
      layout: deleteWidgetFromPreset(
        allWidgets[parentId].layout,
        widgetId,
        widgetType,
      ),
    },
  };
}

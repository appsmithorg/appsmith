import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import {
  LayoutComponentTypes,
  type AnvilHighlightInfo,
  type LayoutComponent,
  type LayoutComponentType,
  type LayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import { AlignmentIndexMap } from "../../constants";

/**
 * Update a layout preset by adding a list of widgets in correct position.
 * @param layouts | LayoutProps[] : List of layouts forming a preset.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @param widgets | string[] : List of widgets to be added.
 * @returns LayoutProps[]
 */
export function addWidgetsToPreset(
  layouts: LayoutProps[],
  highlight: AnvilHighlightInfo,
  widgets: string[],
): LayoutProps[] {
  if (!layouts || !highlight || !widgets || !widgets.length) return layouts;

  /**
   * STEP 1: Find the affected child layout to insert the widgetId in.
   */
  const { layoutOrder } = highlight;
  if (!layoutOrder || !layoutOrder.length) return layouts;

  const affectedLayout: LayoutProps | undefined = getAffectedLayout(layouts, [
    ...layoutOrder,
  ]);

  if (!affectedLayout) return layouts;

  const Comp: LayoutComponent = LayoutFactory.get(affectedLayout.layoutType);

  /**
   * STEP 2: Prepare the widgets to be added.
   */
  const children: string[] | LayoutProps[] = prepareWidgetsForAddition(
    Comp,
    affectedLayout,
    highlight,
    widgets,
  );

  /**
   * STEP 3: Update the layout json of affected layout.
   */
  const updatedLayout: LayoutProps = Comp.addChild(
    affectedLayout,
    children,
    highlight,
  );

  /**
   * STEP 4: Update the parent layout with the updated child layout.
   */
  return updateAffectedLayout(layouts, updatedLayout, [...layoutOrder]);
}

/**
 * Extract target layout component json from parent layout.
 * @param layouts | LayoutProps[] - List of layouts to search in.
 * @param order | string[] - (Top - down) hierarchy of layoutIds.
 * @returns LayoutProps
 */
export function getAffectedLayout(
  layouts: LayoutProps[],
  order: string[],
): LayoutProps | undefined {
  if (!layouts || !order || !order.length) return;

  for (const each of layouts) {
    if (each.layoutId === order[0]) {
      if (order.length === 1) return each;
      else
        return getAffectedLayout(each.layout as LayoutProps[], order.slice(1));
    }
  }
}

/**
 * Using provided order, update the nested layout structure with new child layout json.
 * @param layouts | LayoutProps[] : List of layouts.
 * @param updatedLayout | LayoutProps : Updated layout json.
 * @param order | string[] : (Top - down) hierarchy of layoutIds.
 * @returns LayoutProps[]
 */
export function updateAffectedLayout(
  layouts: LayoutProps[],
  updatedLayout: LayoutProps,
  order: string[],
): LayoutProps[] {
  return layouts.map((layout: LayoutProps) => {
    if (layout.layoutId === order[0]) {
      if (order.length === 1) return updatedLayout;
      else {
        return {
          ...layout,
          layout: updateAffectedLayout(
            layout.layout as LayoutProps[],
            updatedLayout,
            order.slice(1),
          ),
        };
      }
    }
    return layout;
  });
}

/**
 * Having identified the layout in which to drop the widgets,
 * Prepare the widgets to addition to the layout.
 * 1. If layout has a childTemplate. Use the template to generate a new layout to wrap the widgets in.
 * 2. Else, widgets will be added to the layout directly.
 * @param Comp | LayoutComponent : LayoutComponent to drop the widgets into.
 * @param layoutProps | LayoutProps : Layout json of the Comp.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @param widgets | string[] : List of widgets to be added.
 * @returns string[] | LayoutProps[]
 */
export function prepareWidgetsForAddition(
  Comp: LayoutComponent,
  layoutProps: LayoutProps,
  highlight: AnvilHighlightInfo,
  widgets: string[],
): string[] | LayoutProps[] {
  if (!widgets || !widgets.length) return [];

  const childTemplate: LayoutProps | undefined =
    Comp.getChildTemplate(layoutProps);

  /**
   * If childTemplate is undefined,
   * return widgets as they are.
   * They will be added to the affected layout directly.
   */
  if (!childTemplate) return widgets;

  /**
   * Get the layout json of the new layout to wrap the widgets in.
   */
  const updatedTemplate = addWidgetsToTemplate(
    childTemplate,
    highlight,
    widgets,
  );

  return [updatedTemplate];
}

/**
 * Update the template json and add the widget(s) to it.
 * @param template | LayoutProps : Json of the template to wrap the widget(s) in.
 * @param highlight | AnvilHighlightInfo : Drop information.
 * @param widgets | string[] : List of widget ids.
 * @returns LayoutProps
 */
export function addWidgetsToTemplate(
  template: LayoutProps,
  highlight: AnvilHighlightInfo,
  widgets: string[],
): LayoutProps {
  // Generate a layoutId.
  let obj: LayoutProps = {
    ...template,
    layoutId: generateReactKey(),
  };
  /**
   * Child template json can be deeply nested.
   * The child layout to which the widget(s) have to be added,
   * is determined by presence of insertChild prop.
   */
  if (obj.insertChild) {
    /**
     * If child layout has alignments,
     * then use highlight information to determine the alignment
     * in which to drop the widgets.
     */
    if (hasAlignments(obj.layoutType)) {
      const index: number = AlignmentIndexMap[highlight.alignment];
      const layout: string[][] = obj.layout as string[][];
      // Update the appropriate alignment.
      layout[index] = [...layout[index], ...widgets];
      obj = {
        ...obj,
        layout,
      } as LayoutProps;
    } else {
      obj = {
        ...obj,
        layout: [...obj.layout, ...widgets],
      } as LayoutProps;
    }
  } else if (obj.layout.length && typeof obj.layout[0] !== "string") {
    /**
     * There are nested layouts.
     * Parse them to identify the layout to drop widgets in.
     */
    obj.layout = (obj.layout as LayoutProps[]).map((each) =>
      addWidgetsToTemplate(each, highlight, widgets),
    );
  }
  return obj;
}

export function hasAlignments(layoutType: LayoutComponentType): boolean {
  return layoutType === LayoutComponentTypes.ALIGNED_ROW;
}

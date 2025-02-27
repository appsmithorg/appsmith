import type { WidgetProps } from "widgets/BaseWidget";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { createZoneAndAddWidgets } from "./zoneUtils";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { call } from "redux-saga/effects";
import { severTiesFromParents, transformMovedWidgets } from "./moveUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { anvilWidgets } from "widgets/wds/constants";
import { addNewAnvilWidgetToDSL } from "layoutSystems/anvil/integrations/sagas/anvilWidgetAdditionSagas/helpers";

export function* createSectionAndAddWidget(
  allWidgets: CanvasWidgetsReduxState,
  highlight: AnvilHighlightInfo,
  draggedWidgets: WidgetLayoutProps[],
  parentId: string,
) {
  /**
   * Step 1: Create Section widget.
   */
  const widgetId: string = generateReactKey();
  const updatedWidgets: CanvasWidgetsReduxState = yield addNewAnvilWidgetToDSL(
    allWidgets,
    {
      widgetId,
      type: anvilWidgets.SECTION_WIDGET,
      parentId,
    },
  );

  /**
   * Step 2: Extract canvas widget and section layout.
   */

  const sectionProps: FlattenedWidgetProps = updatedWidgets[widgetId];

  /**
   * Step 3: Add widgets to section. and update relationships.
   */
  const res: { canvasWidgets: CanvasWidgetsReduxState; section: WidgetProps } =
    yield call(
      addWidgetsToSection,
      updatedWidgets,
      draggedWidgets,
      highlight,
      sectionProps,
    );

  return res;
}

/**
 * Split widgets into two groups depending on their type === ZONE_WIDGET.
 * @param widgets | WidgetLayoutProps[] : List of dragged widgets.
 * @returns WidgetLayoutProps[][] : List of dragged widgets split by type.
 */
export function splitWidgets(
  widgets: WidgetLayoutProps[],
): WidgetLayoutProps[][] {
  const zones: WidgetLayoutProps[] = [];
  const nonZones: WidgetLayoutProps[] = [];

  widgets.forEach((widget: WidgetLayoutProps) => {
    if (widget.widgetType === anvilWidgets.ZONE_WIDGET) {
      zones.push(widget);
    } else {
      nonZones.push(widget);
    }
  });

  return [zones, nonZones];
}

function* addZoneToSection(
  allWidgets: CanvasWidgetsReduxState,
  canvasProps: WidgetProps,
  sectionLayout: LayoutProps,
  sectionComp: typeof BaseLayoutComponent,
  highlight: AnvilHighlightInfo,
  zone: WidgetLayoutProps,
) {
  const { widgetId: zoneWidgetId } = zone;
  const { widgetId: sectionWidgetId } = canvasProps;
  let canvasWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  if (!canvasWidgets[zoneWidgetId]) {
    /**
     * Zone does not exist.
     * => New widget.
     * => Create it and add to section.
     */
    canvasWidgets = yield addNewAnvilWidgetToDSL(canvasWidgets, {
      widgetId: zoneWidgetId,
      type: anvilWidgets.ZONE_WIDGET,
      parentId: sectionWidgetId,
    });
  } else {
    /**
     * Add zone widgetIds to canvas.children.
     */
    canvasWidgets = {
      ...canvasWidgets,
      [sectionWidgetId]: {
        ...canvasWidgets[sectionWidgetId],
        children: [
          ...(canvasWidgets[sectionWidgetId].children ?? []),
          zoneWidgetId,
        ],
      },
      [zoneWidgetId]: {
        ...canvasWidgets[zoneWidgetId],
        parentId: canvasProps.widgetId,
      },
    };
  }

  /**
   * Add zone to section layout.
   */
  const updatedSectionLayout = sectionComp.addChild(
    sectionLayout,
    [zone],
    highlight,
  );

  return {
    canvasWidgets,
    section: updatedSectionLayout,
  };
}

export function* addWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  section: WidgetProps,
) {
  let canvasWidgets = { ...allWidgets };
  let sectionProps = { ...section };
  let sectionLayout: LayoutProps = section.layout[0];
  /**
   * Step 1: Split widgets into zones and non zones.
   *
   * Zone widgets are added to the section directly.
   *
   * Non zone widgets are added to a newly created Zone that gets inserted into the section.
   *
   * TODO: This doesn't handle the maxChildLimit of 4 for sections.
   * What to do if addition of new zones will lead to total zone count to be greater than 4?
   * Can this be prevent during DnD itself? i.e. Don't show highlights for sections that can't handle so many zones.
   */
  const [zones, nonZones] = splitWidgets(draggedWidgets);
  let itemsAdded = 0;
  /**
   * Step 2: Add zones to the section layout.
   */
  const sectionComp: typeof BaseLayoutComponent = LayoutFactory.get(
    sectionLayout.layoutType,
  );

  for (const zone of zones) {
    const res: {
      canvasWidgets: CanvasWidgetsReduxState;
      section: LayoutProps;
    } = yield call(
      addZoneToSection,
      canvasWidgets,
      sectionProps,
      sectionLayout,
      sectionComp,
      { ...highlight, rowIndex: highlight.rowIndex + itemsAdded },
      zone,
    );

    sectionProps = res.canvasWidgets[sectionProps.widgetId];
    sectionLayout = res.section;
    canvasWidgets = res.canvasWidgets;
    itemsAdded += 1;
  }

  /**
   * Step 3: Create new zone and add to section.
   */
  if (nonZones.length) {
    /**
     * 1. Create new zone.
     * 2. Add non zoned widgets to it.
     * 3. Add the new zone and canvas to canvasWidgets.
     */
    const data: { canvasWidgets: CanvasWidgetsReduxState; zone: WidgetProps } =
      yield call(
        createZoneAndAddWidgets,
        canvasWidgets,
        nonZones,
        { ...highlight, rowIndex: highlight.rowIndex + itemsAdded },
        sectionProps.widgetId,
      );

    sectionProps.children = [
      ...(sectionProps?.children || []),
      data.zone.widgetId,
    ];
    sectionLayout = sectionComp.addChild(
      sectionLayout,
      [
        {
          alignment: FlexLayerAlignment.Start,
          widgetId: data.zone.widgetId,
          widgetType: data.zone.type,
        },
      ],
      highlight,
    );
    canvasWidgets = data.canvasWidgets;
  }

  /**
   * Step 4: Update canvas widget with the updated preset.
   */
  sectionProps.layout = [sectionLayout];

  return {
    canvasWidgets: {
      ...canvasWidgets,
      [sectionProps.widgetId]: sectionProps,
    },
    section: sectionProps,
  };
}

export function* moveWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };

  /**
   * Remove moved widgets from previous parents.
   */
  widgets = severTiesFromParents(widgets, movedWidgets);

  /**
   * Get the new Section and its Canvas.
   */
  const { canvasId } = highlight;

  const section: FlattenedWidgetProps = widgets[canvasId];

  /**
   * Add moved widgets to the section.
   */
  const { canvasWidgets } = yield call(
    addWidgetsToSection,
    widgets,
    transformMovedWidgets(widgets, movedWidgets, highlight),
    highlight,
    section,
  );

  return canvasWidgets;
}

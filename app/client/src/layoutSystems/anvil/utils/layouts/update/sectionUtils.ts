import type { WidgetProps } from "widgets/BaseWidget";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { generateReactKey } from "utils/generators";
import type { RenderModes } from "constants/WidgetConstants";
import {
  FlexLayerAlignment,
  ResponsiveBehavior,
} from "layoutSystems/common/utils/constants";
import { sectionPreset } from "layoutSystems/anvil/layoutComponents/presets/sectionPreset";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { createZoneAndAddWidgets } from "./zoneUtils";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getNextWidgetName } from "sagas/WidgetOperationUtils";
import { getRenderMode } from "selectors/editorSelectors";

export function* createSectionAndAddWidget(
  allWidgets: CanvasWidgetsReduxState,
  highlight: AnvilHighlightInfo,
  widgets: WidgetLayoutProps[],
  parentId: string,
) {
  const evalTree: DataTree = yield select(getDataTree);
  const renderMode: RenderModes = yield select(getRenderMode);
  /**
   * Step 1: Create Section widget.
   */
  const sectionProps: WidgetProps = {
    bottomRow: 10,
    children: [],
    isLoading: false,
    leftColumn: 0,
    parentColumnSpace: 1,
    parentId,
    parentRowSpace: 10,
    renderMode,
    responsiveBehavior: ResponsiveBehavior.Fill,
    rightColumn: 64,
    topRow: 0,
    type: "SECTION_WIDGET",
    version: 1,
    widgetId: generateReactKey(),
    zoneCount: 1,
    widgetName: getNextWidgetName(allWidgets, "SECTION_WIDGET", evalTree),
  };

  /**
   * Step 2: Create Canvas widget and add to Section.
   */
  const preset: LayoutProps[] = sectionPreset();
  const sectionLayout: LayoutProps = preset[0];
  const canvasProps: WidgetProps = {
    bottomRow: 10,
    children: [],
    deleteIfEmpty: true,
    isLoading: false,
    layout: preset,
    leftColumn: 0,
    parentId: sectionProps.widgetId,
    parentColumnSpace: 1,
    parentRowSpace: 10,
    renderMode,
    responsiveBehavior: ResponsiveBehavior.Fill,
    rightColumn: 64,
    topRow: 0,
    type: "CANVAS_WIDGET",
    version: 1,
    widgetId: generateReactKey(),
    widgetName: getNextWidgetName(allWidgets, "CANVAS_WIDGET", evalTree),
  };

  /**
   * Step 3: Add widgets to section. and update relationships.
   */
  const res: { canvasWidgets: CanvasWidgetsReduxState; section: WidgetProps } =
    yield call(
      addWidgetsToSection,
      allWidgets,
      widgets,
      highlight,
      sectionProps,
      canvasProps,
      sectionLayout,
      {
        [sectionProps.widgetId]: sectionProps,
        [canvasProps.widgetId]: canvasProps,
      },
    );

  return res;
}

/**
 * Split widgets into two groups depending on their type === ZONE_WIDGET.
 * @param widgets | WidgetLayoutProps[] : List of dragged widgets.
 * @returns WidgetLayoutProps[][] : List of dragged widgets split by type.
 */
function splitWidgets(widgets: WidgetLayoutProps[]): WidgetLayoutProps[][] {
  const zones: WidgetLayoutProps[] = [];
  const nonZones: WidgetLayoutProps[] = [];
  widgets.forEach((widget: WidgetLayoutProps) => {
    if (widget.widgetType === "ZONE_WIDGET") {
      zones.push(widget);
    } else {
      nonZones.push(widget);
    }
  });
  return [zones, nonZones];
}

function addZoneToSection(
  canvasProps: WidgetProps,
  sectionLayout: LayoutProps,
  sectionComp: typeof BaseLayoutComponent,
  highlight: AnvilHighlightInfo,
  zone: WidgetLayoutProps,
) {
  /**
   * Step 1: Add zone widgetIds to canvas.children.
   */
  canvasProps.children = [...canvasProps.children, zone.widgetId];

  /**
   * Step 2: Add zone to section layout.
   */
  sectionLayout = sectionComp.addChild(sectionLayout, [zone], highlight);

  return {
    canvas: canvasProps,
    section: sectionLayout,
  };
}

export function* addWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  section: WidgetProps,
  canvas: WidgetProps,
  sectionLayout: LayoutProps,
  additionalWidgets: CanvasWidgetsReduxState = {},
) {
  let canvasWidgets = { ...allWidgets };
  const sectionProps = { ...section };
  let canvasProps = { ...canvas };
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

  /**
   * Step 2: Add zones to the section layout.
   */
  const sectionComp: typeof BaseLayoutComponent = LayoutFactory.get(
    sectionLayout.layoutType,
  );

  zones.forEach((zone: WidgetLayoutProps) => {
    const res: { canvas: WidgetProps; section: LayoutProps } = addZoneToSection(
      canvasProps,
      sectionLayout,
      sectionComp,
      highlight,
      zone,
    );
    canvasProps = res.canvas;
    sectionLayout = res.section;
    // Update parent of the zone.
    canvasWidgets = {
      ...canvasWidgets,
      [zone.widgetId]: {
        ...canvasWidgets[zone.widgetId],
        parentId: canvasProps.widgetId,
      },
    };
  });

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
        highlight,
        canvasProps.widgetId,
        additionalWidgets,
      );
    canvasProps.children = [...canvasProps.children, data.zone.widgetId];
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
   * Step 4: Update section preset with the updated section layout.
   */
  // preset = sectionLayout;

  /**
   * Step 5: Update canvas widget with the updated preset.
   */
  canvasProps.layout = [sectionLayout];

  /**
   * Step 6: Establish relationship between section and canvas widget.
   */
  sectionProps.children = [canvasProps.widgetId];
  canvasProps.parentId = sectionProps.widgetId;

  return {
    canvasWidgets: {
      ...canvasWidgets,
      [canvasProps.widgetId]: canvasProps,
      [sectionProps.widgetId]: sectionProps,
    },
    section: sectionProps,
  };
}

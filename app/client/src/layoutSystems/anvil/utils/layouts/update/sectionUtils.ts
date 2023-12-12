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
import type {
  CanvasWidgetsReduxState,
  CrudWidgetsPayload,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call } from "redux-saga/effects";
import {
  severTiesFromParents,
  severTiesFromParentsUpdates,
  transformMovedWidgets,
} from "./moveUtils";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { SectionWidget } from "widgets/anvil/SectionWidget";
import {
  addNewWidgetToDsl,
  getCreateWidgetPayload,
} from "../../widgetAdditionUtils";
import { getUpdateItem } from "../../widgetUtils";

export function* createSectionAndAddWidget(
  allWidgets: CanvasWidgetsReduxState,
  highlight: AnvilHighlightInfo,
  widgets: WidgetLayoutProps[],
  parentId: string,
  updatesPayload: CrudWidgetsPayload,
) {
  /**
   * Step 1: Create Section widget.
   */
  const widgetId: string = generateReactKey();
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    addNewWidgetToDsl,
    allWidgets,
    getCreateWidgetPayload(widgetId, SectionWidget.type, parentId),
  );

  /**
   * Step 2: Extract canvas widget and section layout.
   */

  const sectionProps: FlattenedWidgetProps = updatedWidgets[widgetId];

  const preset: LayoutProps[] = sectionProps.layout;
  const sectionLayout: LayoutProps = preset[0];
  const newUpdatesPayload: CrudWidgetsPayload = {
    ...updatesPayload,
    add: { ...updatesPayload.add, [sectionProps.widgetId]: sectionProps },
  };
  /**
   * Step 3: Add widgets to section. and update relationships.
   */
  const res: {
    canvasWidgets: CanvasWidgetsReduxState;
    section: WidgetProps;
    updatesPayload: CrudWidgetsPayload;
  } = yield call(
    addWidgetsToSection,
    updatedWidgets,
    widgets,
    highlight,
    sectionProps,
    sectionLayout,
    newUpdatesPayload,
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
    if (widget.widgetType === ZoneWidget.type) {
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
  sectionLayout: LayoutProps,
  updatesPayload: CrudWidgetsPayload,
) {
  let canvasWidgets = { ...allWidgets };
  let sectionProps = { ...section };
  let newUpdatesPayload: CrudWidgetsPayload = { ...updatesPayload };
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
      sectionProps,
      sectionLayout,
      sectionComp,
      highlight,
      zone,
    );

    sectionProps = res.canvas;
    sectionLayout = res.section;
    // Update parent of the zone.
    canvasWidgets = {
      ...canvasWidgets,
      [zone.widgetId]: {
        ...canvasWidgets[zone.widgetId],
        parentId: sectionProps.widgetId,
      },
    };
    newUpdatesPayload = {
      ...newUpdatesPayload,
      update: {
        ...newUpdatesPayload.update,
        [zone.widgetId]: [getUpdateItem("parentId", sectionProps.widgetId)],
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
    const data: {
      canvasWidgets: CanvasWidgetsReduxState;
      updatesPayload: CrudWidgetsPayload;
      zone: WidgetProps;
    } = yield call(
      createZoneAndAddWidgets,
      canvasWidgets,
      nonZones,
      highlight,
      sectionProps.widgetId,
      newUpdatesPayload,
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
    newUpdatesPayload = data.updatesPayload;
  }

  /**
   * Step 4: Update canvas widget with the updated preset.
   */
  sectionProps.layout = [sectionLayout];

  const isNewSection: boolean =
    !!newUpdatesPayload.add && !!newUpdatesPayload.add?.[sectionProps.widgetId];

  if (isNewSection) {
    newUpdatesPayload = {
      ...newUpdatesPayload,
      add: {
        ...newUpdatesPayload.add,
        [sectionProps.widgetId]: sectionProps,
      },
    };
  } else {
    newUpdatesPayload = {
      ...newUpdatesPayload,
      update: {
        ...newUpdatesPayload.update,
        [sectionProps.widgetId]: [
          getUpdateItem("children", sectionProps.children),
          getUpdateItem("layout", sectionProps.layout),
        ],
      },
    };
  }

  return {
    canvasWidgets: {
      ...canvasWidgets,
      [sectionProps.widgetId]: sectionProps,
    },
    section: sectionProps,
    updatesPayload: newUpdatesPayload,
  };
}

export function* moveWidgetsToSection(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: string[],
  highlight: AnvilHighlightInfo,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let updatesPayload: CrudWidgetsPayload = {
    add: {},
    remove: [],
    update: {},
  };
  /**
   * Step 1: Remove moved widgets from previous parents.
   */
  const res = severTiesFromParentsUpdates(
    widgets,
    movedWidgets,
    updatesPayload,
  );
  widgets = res.widgets;
  updatesPayload = res.updatesPayload;

  /**
   * Step 2: Get the new Section and its Canvas.
   */
  const { canvasId } = highlight;

  const section: FlattenedWidgetProps = widgets[canvasId];

  /**
   * Step 3: Add moved widgets to the section.
   */
  const result: {
    canvasWidgets: CanvasWidgetsReduxState;
    updatesPayload: CrudWidgetsPayload;
  } = yield call(
    addWidgetsToSection,
    widgets,
    transformMovedWidgets(widgets, movedWidgets, highlight),
    highlight,
    section,
    section.layout[0],
    updatesPayload,
  );

  return result;
}

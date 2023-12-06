import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { addWidgetsToSection } from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { generateReactKey } from "utils/generators";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import type { WidgetProps } from "widgets/BaseWidget";
import { addNewChildToDSL } from "../AnvilDraggingSagas";
import { sectionPreset } from "layoutSystems/anvil/layoutComponents/presets/sectionPreset";

function getSectionLastColumnHighlight(sectionWidget: FlattenedWidgetProps) {
  const layoutId: string = sectionWidget.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = sectionWidget.layout[0].layout.length;
  return {
    canvasId: sectionWidget.widgetId,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  } as AnvilHighlightInfo;
}

function* mergeZones(
  allWidgets: CanvasWidgetsReduxState,
  mergingIntoZoneId: string,
  mergingFromZoneId: string,
) {
  const zone1: FlattenedWidgetProps = allWidgets[mergingIntoZoneId];
  const zone2: FlattenedWidgetProps = allWidgets[mergingFromZoneId];
  const sectionWidget: FlattenedWidgetProps = allWidgets[zone1.parentId || ""];
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  if (sectionWidget && sectionWidget.children && zone1 && zone2) {
    const mergedZoneLayout: LayoutProps[] = [
      ...zone1.layout[0].layout,
      ...zone2.layout[0].layout,
    ];
    const mergedSectionLayout: WidgetLayoutProps[] =
      sectionWidget.layout[0].layout.filter((each: WidgetLayoutProps) => {
        return each.widgetId !== zone2.widgetId;
      });
    updatedWidgets = {
      ...updatedWidgets,
      [sectionWidget.widgetId]: {
        ...sectionWidget,
        layout: [
          {
            ...sectionWidget.layout[0],
            layout: mergedSectionLayout,
          },
        ],
        children: sectionWidget.children.filter(
          (each) => each !== zone2.widgetId,
        ),
      },
      [zone1.widgetId]: {
        ...zone1,
        layout: [
          {
            ...zone1.layout[0],
            layout: mergedZoneLayout,
          },
        ],
        children: [...(zone1.children || []), ...(zone2.children || [])],
      },
    };
    (zone2.children || []).forEach((each: string) => {
      updatedWidgets[each] = {
        ...updatedWidgets[each],
        parentId: zone1.widgetId,
      };
    });
    delete updatedWidgets[zone2.widgetId];
  }
  return updatedWidgets;
}

export function* mergeLastZonesOfSection(
  numberOfZonesToMerge: number,
  zoneOrder: string[],
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  if (numberOfZonesToMerge > 0 && zoneOrder) {
    let count = 0;
    const currentZoneCount = zoneOrder.length;
    do {
      const widgetsPostMerge: CanvasWidgetsReduxState = yield call(
        mergeZones,
        updatedWidgets,
        zoneOrder[currentZoneCount - count - 2],
        zoneOrder[currentZoneCount - count - 1],
      );
      updatedWidgets = {
        ...widgetsPostMerge,
      };
      ++count;
    } while (count < numberOfZonesToMerge);
  }
  return updatedWidgets;
}

export function* addNewZonesToSection(
  sectionWidgetId: string,
  numberOfZonesToCreate: number,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets = { ...allWidgets };
  let count = 0;
  const createdZoneIds: string[] = [];
  do {
    const sectionWidget: FlattenedWidgetProps = updatedWidgets[sectionWidgetId];
    const newWidget: any = {
      newWidgetId: generateReactKey(),
      parentId: sectionWidget.widgetId,
      type: ZoneWidget.type,
    };
    const highlight = getSectionLastColumnHighlight(sectionWidget);
    updatedWidgets = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
      false,
      false,
    );
    createdZoneIds.push(newWidget.newWidgetId);
    count++;
  } while (count < numberOfZonesToCreate);
  return { updatedWidgets, createdZoneIds };
}

export function* addWidgetToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  widgetId: string,
) {
  /**
   * Add new widgets to section.
   */
  let sectionWidget: WidgetProps = {
    ...allWidgets[highlight.canvasId],
    children: (allWidgets[highlight.canvasId].children || []).filter(
      (each: string) => each !== widgetId,
    ),
  };
  const preset: LayoutProps[] = sectionWidget.layout
    ? sectionWidget.layout
    : sectionPreset();
  const res: {
    canvasWidgets: CanvasWidgetsReduxState;
    section: WidgetProps;
  } = yield call(
    addWidgetsToSection,
    allWidgets,
    draggedWidgets,
    highlight,
    sectionWidget,
    preset[0],
  );
  sectionWidget = res.canvasWidgets[highlight.canvasId];

  return {
    ...res.canvasWidgets,
    [sectionWidget.widgetId]: sectionWidget,
  };
}

import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
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

function getSectionLastColumnHighlight(sectionCanvas: FlattenedWidgetProps) {
  const layoutId: string = sectionCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = sectionCanvas.layout[0].layout.length;
  return {
    canvasId: sectionCanvas.widgetId,
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
  const zone1 = allWidgets[mergingIntoZoneId];
  const zone2 = allWidgets[mergingFromZoneId];
  const sectionCanvas = allWidgets[zone1.parentId || ""];
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  if (
    sectionCanvas &&
    sectionCanvas.children &&
    zone1 &&
    zone2 &&
    zone1.children &&
    zone2.children
  ) {
    const zone1Canvas = allWidgets[zone1.children[0]];
    const zone2Canvas = allWidgets[zone2.children[0]];
    if (zone1Canvas.children && zone2Canvas.children) {
      const mergedZoneLayout = [
        ...zone1Canvas.layout[0].layout,
        ...zone2Canvas.layout[0].layout,
      ];
      const mergedSectionLayout = sectionCanvas.layout[0].layout.filter(
        (each: any) => {
          return each.widgetId !== zone2.widgetId;
        },
      );
      updatedWidgets = {
        ...updatedWidgets,
        [sectionCanvas.widgetId]: {
          ...sectionCanvas,
          layout: [
            {
              ...sectionCanvas.layout[0],
              layout: mergedSectionLayout,
            },
          ],
          children: sectionCanvas.children.filter(
            (each) => each !== zone2.widgetId,
          ),
        },
        [zone1Canvas.widgetId]: {
          ...zone1Canvas,
          layout: [
            {
              ...zone1Canvas.layout[0],
              layout: mergedZoneLayout,
            },
          ],
          children: [...zone1Canvas.children, ...zone2Canvas.children],
        },
      };
      zone2Canvas.children.forEach((each) => {
        updatedWidgets[each] = {
          ...updatedWidgets[each],
          parentId: zone1Canvas.widgetId,
        };
      });
      delete updatedWidgets[zone2.widgetId];
      delete updatedWidgets[zone2Canvas.widgetId];
    }
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
  sectionCanvasId: string,
  numberOfZonesToCreate: number,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets = { ...allWidgets };
  let count = 0;
  const createdZoneIds: string[] = [];
  do {
    const sectionCanvas = updatedWidgets[sectionCanvasId];
    const newWidget: any = {
      newWidgetId: generateReactKey(),
      parentId: sectionCanvas.widgetId,
      type: ZoneWidget.type,
    };
    const highlight = getSectionLastColumnHighlight(sectionCanvas);
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

export function addWidgetToSection(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  widgetId: string,
) {
  /**
   * Add new widgets to section.
   */
  const canvasWidget: WidgetProps = allWidgets[highlight.canvasId];
  const canvasPreset: LayoutProps[] = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();
  const res: {
    canvasWidgets: CanvasWidgetsReduxState;
    section: WidgetProps;
  } = addWidgetsToSection(
    allWidgets,
    draggedWidgets,
    highlight,
    allWidgets[canvasWidget.parentId || MAIN_CONTAINER_WIDGET_ID],
    {
      ...canvasWidget,
      children: canvasWidget.children.filter(
        (each: string) => each !== widgetId,
      ),
    },
    canvasPreset[0],
  );
  const sectionCanvas = res.canvasWidgets[highlight.canvasId];
  const sectionWidget =
    res.canvasWidgets[sectionCanvas.parentId || MAIN_CONTAINER_WIDGET_ID];
  return {
    ...res.canvasWidgets,
    [sectionWidget.widgetId]: {
      ...sectionWidget,
      zoneCount: sectionCanvas.layout[0].layout.length,
    },
  };
}

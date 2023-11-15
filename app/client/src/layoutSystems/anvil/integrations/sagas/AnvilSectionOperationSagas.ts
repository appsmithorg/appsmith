import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { updateAndSaveLayout } from "actions/pageActions";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";
import { generateReactKey } from "utils/generators";
import { ZoneWidget } from "widgets/anvil/ZoneWidget";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { addNewChildToDSL } from "./AnvilDraggingSagas";

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

function* mergeLastZonesOfSection(
  sectionCanvas: FlattenedWidgetProps,
  numberOfZonesToMerge: number,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  if (numberOfZonesToMerge > 0 && sectionCanvas.children) {
    let count = 0;
    const currentZoneCount = sectionCanvas.children.length;
    do {
      const widgetsPostMerge: CanvasWidgetsReduxState = yield call(
        mergeZones,
        updatedWidgets,
        sectionCanvas.children[currentZoneCount - count - 2],
        sectionCanvas.children[currentZoneCount - count - 1],
      );
      updatedWidgets = {
        ...widgetsPostMerge,
      };
      ++count;
    } while (count < numberOfZonesToMerge);
  }
  return updatedWidgets;
}

function* addNewZonesToSection(
  sectionCanvasId: string,
  numberOfZonesToCreate: number,
) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  let updatedWidgets = { ...allWidgets };
  let count = 0;
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
    count++;
  } while (count < numberOfZonesToCreate);
  return updatedWidgets;
}

function* UpdateZonesCountOfSection(
  actionPayload: ReduxAction<{
    zoneCount: number;
    sectionWidgetId: string;
  }>,
) {
  const { sectionWidgetId, zoneCount } = actionPayload.payload;
  if (zoneCount <= 4 && zoneCount > 0) {
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const sectionWidget = allWidgets[sectionWidgetId];
    if (sectionWidget && sectionWidget.children) {
      const sectionCanvasId = sectionWidget.children[0];
      if (sectionCanvasId) {
        const sectionCanvas = allWidgets[sectionCanvasId];
        const currentZoneCount = sectionCanvas.children
          ? sectionCanvas.children.length
          : 0;
        let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

        if (currentZoneCount > zoneCount) {
          updatedWidgets = yield call(
            mergeLastZonesOfSection,
            sectionCanvas,
            currentZoneCount - zoneCount,
          );
        } else if (currentZoneCount < zoneCount) {
          updatedWidgets = yield call(
            addNewZonesToSection,
            sectionCanvas.widgetId,
            zoneCount - currentZoneCount,
          );
        }
        updatedWidgets[sectionWidgetId] = {
          ...updatedWidgets[sectionWidgetId],
          zoneCount,
        };
        yield put(updateAndSaveLayout(updatedWidgets));
      }
    }
  }
}

export default function* anvilSectionOperationsSagas() {
  yield all([
    takeLatest(
      AnvilReduxActionTypes.ANVIL_SECTION_ZONES_UPDATE,
      UpdateZonesCountOfSection,
    ),
  ]);
}

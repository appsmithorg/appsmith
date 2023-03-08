import { AppState } from "ce/reducers";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { FLEXBOX_PADDING, GridDefaults } from "constants/WidgetConstants";
import moment from "moment";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";
import { getIsMobile } from "./mainCanvasSelectors";

export type ReadableSnapShotDetails = {
  timeSince: string;
  timeTillExpiration: string;
  readableDate: string;
};

export const getFlexLayers = (parentId: string) => {
  return createSelector(getWidgets, (widgets): FlexLayer[] => {
    const parent = widgets[parentId];
    if (!parent) return [];
    return parent?.flexLayers || [];
  });
};

export const getSiblingCount = (widgetId: string, parentId: string) => {
  return createSelector(getFlexLayers(parentId), (flexLayers): number => {
    if (!flexLayers) return -1;
    const selectedLayer = flexLayers?.find((layer: FlexLayer) =>
      layer.children?.some((child: LayerChild) => child.id === widgetId),
    );
    if (!selectedLayer) return -1;
    return selectedLayer.children?.length;
  });
};

export const getLayerIndex = (widgetId: string, parentId: string) => {
  return createSelector(
    getFlexLayers(parentId),
    (layers: FlexLayer[]): number => {
      if (!layers) return -1;
      const selectedLayer = layers.find((layer: FlexLayer) =>
        layer.children.some((child: LayerChild) => child.id === widgetId),
      );
      if (!selectedLayer) return -1;
      return selectedLayer.children?.findIndex(
        (child: LayerChild) => child.id === widgetId,
      );
    },
  );
};

export const isCurrentCanvasDragging = (widgetId: string) => {
  return createSelector(
    (state: AppState) => state.ui.widgetDragResize.dragDetails,
    (dragDetails): boolean => {
      return dragDetails?.draggedOn === widgetId;
    },
  );
};

export const getParentOffsetTop = (widgetId: string) =>
  createSelector(getWidgets, getIsMobile, (widgets, isMobile): number => {
    const widget = widgets[widgetId];
    if (!widget || !widget.parentId) return 0;
    const parent = widgets[widget.parentId];
    const top =
      isMobile && parent.mobileTopRow !== undefined
        ? parent.mobileTopRow
        : parent.topRow;
    return top * GridDefaults.DEFAULT_GRID_ROW_HEIGHT + FLEXBOX_PADDING;
  });

export const getReadableSnapShotDetails = createSelector(
  (state: AppState) =>
    state.ui.layoutConversion.snapshotDetails?.lastUpdatedTime,
  (
    lastUpdatedDateString: string | undefined,
  ): ReadableSnapShotDetails | undefined => {
    if (!lastUpdatedDateString) return;

    const lastUpdatedDate = new Date(lastUpdatedDateString);

    if (Date.now() - lastUpdatedDate.getTime() <= 0) return;

    const millisecondsPerHour = 60 * 60 * 1000;
    const ExpirationHours = 5 * 24;
    const hoursPassedSince =
      (Date.now() - lastUpdatedDate.getTime()) / millisecondsPerHour;

    const timeSince: string = getStringFromHours(hoursPassedSince);
    const timeTillExpiration: string = getStringFromHours(
      ExpirationHours - hoursPassedSince,
    );

    const readableDate = moment(lastUpdatedDate).format("Do MMMM, YYYY h:mm a");

    return {
      timeSince,
      timeTillExpiration,
      readableDate,
    };
  },
);

function getStringFromHours(hours: number) {
  if (hours > 48) return `${Math.round(hours / 24)} days`;
  else if (hours < 48 && hours > 24) return `1 day`;
  else if (hours > 1) return `${Math.round(hours)} hours`;
  else if (hours > 0) return `less than an hour`;
  else return "";
}

export function buildSnapshotTimeString(
  readableSnapShotDetails: ReadableSnapShotDetails | undefined,
) {
  if (!readableSnapShotDetails) return "";
  const { readableDate, timeSince } = readableSnapShotDetails;
  return `Snapshot from ${timeSince} ago (${readableDate})`;
}

export function buildSnapshotExpirationTimeString(
  readableSnapShotDetails: ReadableSnapShotDetails | undefined,
) {
  if (!readableSnapShotDetails) return "";
  const { timeTillExpiration } = readableSnapShotDetails;
  return `Snapshot expires in ${timeTillExpiration}`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DSLWidget } from "../types";

export const mapDataMigration = (currentDSL: DSLWidget) => {
  currentDSL.children = currentDSL.children?.map((children: DSLWidget) => {
    if (children.type === "MAP_WIDGET") {
      if (children.markers) {
        children.markers = children.markers.map(
          (marker: { lat: any; lng: any; long: any; title: any }) => {
            return {
              lat: marker.lat,
              long: marker.lng || marker.long,
              title: marker.title,
            };
          },
        );
      }

      if (children.defaultMarkers) {
        const defaultMarkers = JSON.parse(children.defaultMarkers);

        children.defaultMarkers = defaultMarkers.map(
          (marker: {
            lat: number;
            lng: number;
            long: number;
            title: string;
          }) => {
            return {
              lat: marker.lat,
              long: marker.lng || marker.long,
              title: marker.title,
            };
          },
        );
      }

      if (children.selectedMarker) {
        children.selectedMarker = {
          lat: children.selectedMarker.lat,
          long: children.selectedMarker.lng || children.selectedMarker.long,
          title: children.selectedMarker.title,
        };
      }

      if (children.mapCenter) {
        children.mapCenter = {
          lat: children.mapCenter.lat,
          long: children.mapCenter.lng || children.mapCenter.long,
          title: children.mapCenter.title,
        };
      }

      if (children.center) {
        children.center = {
          lat: children.center.lat,
          long: children.center.lng || children.center.long,
          title: children.center.title,
        };
      }
    } else if (children.children && children.children.length > 0) {
      children = mapDataMigration(children);
    }

    return children;
  });

  return currentDSL;
};

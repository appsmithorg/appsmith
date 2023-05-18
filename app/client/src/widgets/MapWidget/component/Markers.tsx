import React from "react";

import Marker from "./Marker";
import type { MapComponentProps } from ".";

type MarkersProps = {
  map?: google.maps.Map;
} & Pick<
  MapComponentProps,
  | "selectMarker"
  | "updateCenter"
  | "updateMarker"
  | "markers"
  | "selectedMarker"
  | "clickedMarkerCentered"
>;

const Markers: React.FC<MarkersProps> = (props) => {
  const {
    clickedMarkerCentered,
    map,
    markers,
    selectedMarker,
    selectMarker,
    updateCenter,
    updateMarker,
  } = props;

  if (!Array.isArray(markers)) return null;

  return (
    <>
      {markers.map((marker, index) => (
        <Marker
          clickable
          color={marker.color}
          draggable={
            selectedMarker &&
            selectedMarker?.lat === marker.lat &&
            selectedMarker?.long === marker.long
          }
          key={`marker-lat-${marker.lat}-long-${marker.long}}`}
          map={map}
          onClick={() => {
            if (clickedMarkerCentered) {
              updateCenter(marker.lat, marker.long);
            }

            selectMarker(marker.lat, marker.long, marker.title);
          }}
          onDragEnd={(e) => {
            if (e.latLng && e.latLng.lat() && e.latLng.lng()) {
              updateMarker(
                Number(e.latLng.lat()),
                Number(e.latLng.lng()),
                index,
              );
            }
          }}
          position={{
            lat: marker.lat,
            lng: marker.long,
          }}
          title={marker.title}
        />
      ))}
    </>
  );
};

export default Markers;

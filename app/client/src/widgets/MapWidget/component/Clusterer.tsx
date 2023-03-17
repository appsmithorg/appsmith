import React, { useEffect, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

import Marker from "./Marker";
import type { MapComponentProps } from ".";

type ClustererProps = {
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

const Clusterer: React.FC<ClustererProps> = (props) => {
  const {
    clickedMarkerCentered,
    map,
    markers,
    selectedMarker,
    selectMarker,
    updateCenter,
    updateMarker,
  } = props;
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer>();

  // add marker clusterer on map
  useEffect(() => {
    if (!map) return;

    setMarkerClusterer(
      new MarkerClusterer({
        map,
      }),
    );

    return () => {
      if (markerClusterer) {
        markerClusterer.clearMarkers();
      }
    };
  }, [map]);

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
          key={index}
          map={map}
          markerClusterer={markerClusterer}
          onClick={() => {
            if (clickedMarkerCentered) {
              updateCenter(marker.lat, marker.long);
            }

            selectMarker(marker.lat, marker.long, marker.title);
          }}
          onDragEnd={(e) => {
            updateMarker(
              Number(e.latLng?.lat()),
              Number(e.latLng?.lng()),
              index,
            );
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

export default Clusterer;

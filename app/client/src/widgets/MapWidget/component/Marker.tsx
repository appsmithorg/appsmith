import React, { useEffect, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

type MarkerProps = google.maps.MarkerOptions & {
  onClick?: () => void;
  map?: google.maps.Map;
  markerClusterer?: MarkerClusterer;
  onDragEnd?: (e: google.maps.MapMouseEvent) => void;
};

const Marker: React.FC<MarkerProps> = (options) => {
  const { markerClusterer, onClick, onDragEnd, position, ...rest } = options;
  const [marker, setMarker] = useState<google.maps.Marker>();

  useEffect(() => {
    if (!marker) {
      const marker = new google.maps.Marker({ position });

      marker.addListener("click", () => {
        if (onClick) onClick();
      });

      marker.setOptions(rest);

      setMarker(marker);
    }

    if (markerClusterer && marker) {
      markerClusterer.addMarker(marker);
    }

    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null);
      }

      if (markerClusterer && marker) {
        markerClusterer.removeMarker(marker);
      }
    };
  }, [marker, markerClusterer]);

  // add dragend event on marker
  useEffect(() => {
    if (!marker) return;

    marker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
      if (onDragEnd) onDragEnd(e);
    });
  }, [marker, options.onDragEnd]);

  return null;
};

export default Marker;

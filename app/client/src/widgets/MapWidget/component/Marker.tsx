import type React from "react";
import { useEffect, useState } from "react";
import type { MarkerClusterer } from "@googlemaps/markerclusterer";
import { DEFAULT_MARKER_COLOR, MARKER_ICON } from "../constants";

type MarkerProps = google.maps.MarkerOptions & {
  onClick?: () => void;
  map?: google.maps.Map;
  markerClusterer?: MarkerClusterer;
  onDragEnd?: (e: google.maps.MapMouseEvent) => void;
  color?: string;
};

const Marker: React.FC<MarkerProps> = (options) => {
  const { color, map, markerClusterer, onClick, onDragEnd, position, title } =
    options;
  const [marker, setMarker] = useState<google.maps.Marker>();

  const icon = {
    ...MARKER_ICON,
    anchor: new google.maps.Point(12, 24),
    fillColor: color || DEFAULT_MARKER_COLOR,
  };

  useEffect(() => {
    if (!marker) {
      const googleMapMarker = new google.maps.Marker({
        position,
        icon,
        map,
        title,
      });

      setMarker(googleMapMarker);
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
  }, [marker, markerClusterer, map]);

  // track color change
  useEffect(() => {
    if (!marker) return;

    marker.setIcon(icon);
  }, [marker, color]);

  // track position
  useEffect(() => {
    if (!marker) return;

    marker.setPosition(position);
  }, [marker, position]);

  // track title
  useEffect(() => {
    if (!marker) return;

    marker.setTitle(title);
  }, [marker, title]);

  // track on onclick
  useEffect(() => {
    if (!marker) return;

    google.maps.event.clearListeners(marker, "click");
    const clickListener = marker.addListener("click", () => {
      if (onClick) onClick();
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [marker, onClick]);

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

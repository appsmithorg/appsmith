import styled from "styled-components";
import React, { useCallback, useEffect, useRef, useState } from "react";

import Clusterer from "./Clusterer";
import SearchBox from "./SearchBox";
import { MapComponentProps } from ".";
import PickMyLocation from "./PickMyLocation";

const Wrapper = styled.div`
  position: relative;
  height: 100%;
`;

const StyledMap = styled.div<Pick<MapProps, "borderRadius" | "boxShadow">>`
  height: 100%;
  width: 100%;
  border-radius: ${(props) => props.borderRadius};
  box-shadow: ${(props) => props.boxShadow};
`;

type MapProps = {
  children?: React.ReactNode;
} & Pick<
  MapComponentProps,
  | "updateCenter"
  | "zoomLevel"
  | "updateMarker"
  | "selectMarker"
  | "saveMarker"
  | "markers"
  | "center"
  | "enableCreateMarker"
  | "selectedMarker"
  | "borderRadius"
  | "boxShadow"
  | "clickedMarkerCentered"
  | "enableDrag"
>;

const Map = (props: MapProps) => {
  const {
    borderRadius,
    boxShadow,
    center,
    children,
    enableCreateMarker,
    enableDrag,
    markers,
    saveMarker,
    selectMarker,
    updateCenter,
    updateMarker,
    zoomLevel,
  } = props;
  const [map, setMap] = useState<google.maps.Map>();
  const mapRef = useRef<HTMLDivElement>(null);

  // initialize the map instance
  useEffect(() => {
    if (!mapRef.current) return;

    setMap(
      new window.google.maps.Map(mapRef.current, {
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }),
    );
  }, [mapRef]);

  // set center if center is changed
  useEffect(() => {
    if (map) {
      map.setCenter({ lat: center.lat, lng: center.long });
    }
  }, [center, map]);

  // set zoom if zoomLevel is changed
  useEffect(() => {
    if (map) {
      map.setZoom(Math.floor(zoomLevel / 5));
    }
  }, [zoomLevel, map]);

  /**
   * on click map, add marker
   *
   * @param e
   * @returns
   */
  const onClickOnMap = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!enableCreateMarker || !saveMarker) return;

      // only save marker when lag and long are available
      if (e.latLng?.lat() && e.latLng?.lng()) {
        saveMarker(Number(e.latLng.lat()), Number(e.latLng.lng()));
      }
    },
    [enableCreateMarker, saveMarker],
  );

  // NOTE: The event listeners require code to clear existing listeners
  // when a handler passed as a prop has been updated.
  React.useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName),
      );

      map.addListener("click", onClickOnMap);
    }
  }, [map, onClickOnMap]);

  return (
    <Wrapper onMouseLeave={enableDrag}>
      <StyledMap
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        id="map"
        ref={mapRef}
      />
      <Clusterer
        map={map}
        markers={markers}
        selectMarker={selectMarker}
        updateCenter={updateCenter}
        updateMarker={updateMarker}
      />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            map,
          });
        }
      })}
    </Wrapper>
  );
};

Map.PickMyLocation = PickMyLocation;
Map.SearchBox = SearchBox;

export default Map;

import styled from "styled-components";
import React, { useCallback, useEffect, useRef, useState } from "react";

import Clusterer from "./Clusterer";
import SearchBox from "./SearchBox";
import type { MapComponentProps } from ".";
import PickMyLocation from "./PickMyLocation";
import Markers from "./Markers";

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

const StyledMap = styled.div<Pick<MapProps, "borderRadius" | "boxShadow">>`
  width: 100%;
  height: 100%;
  box-shadow: ${(props) => props.boxShadow};
  border-radius: ${(props) => props.borderRadius};
`;

type MapProps = {
  children?: React.ReactNode;
} & Pick<
  MapComponentProps,
  | "updateCenter"
  | "zoomLevel"
  | "enableMapTypeControl"
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
  | "allowClustering"
>;

const Map = (props: MapProps) => {
  const {
    allowClustering,
    borderRadius,
    boxShadow,
    center,
    children,
    enableCreateMarker,
    enableDrag,
    enableMapTypeControl,
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
        mapTypeControl: enableMapTypeControl,
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

  // toggle maptype controls if enableMapTypeControl switch is toggled
  useEffect(() => {
    if (map) {
      if (enableMapTypeControl) {
        map.setOptions({
          mapTypeControl: enableMapTypeControl,
          mapTypeControlOptions: {
            position: google.maps.ControlPosition.BOTTOM_CENTER,
            style: google.maps.MapTypeControlStyle.DEFAULT,
            mapTypeIds: [
              google.maps.MapTypeId.ROADMAP,
              google.maps.MapTypeId.SATELLITE,
            ],
          },
        });
      } else {
        map.setOptions({
          mapTypeControl: enableMapTypeControl,
          mapTypeControlOptions: {},
        });
      }
    }
  }, [enableMapTypeControl, map]);

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

  const MarkersOrCluster = allowClustering ? Clusterer : Markers;

  return (
    <Wrapper onClick={(e) => e.stopPropagation()} onMouseLeave={enableDrag}>
      <StyledMap
        borderRadius={borderRadius}
        boxShadow={boxShadow}
        id="map"
        ref={mapRef}
      />
      {map && (
        <MarkersOrCluster
          key={`markers-${
            allowClustering ? "cluster" : "markers"
          }-${markers?.length}`}
          map={map}
          markers={markers}
          selectMarker={selectMarker}
          updateCenter={updateCenter}
          updateMarker={updateMarker}
        />
      )}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

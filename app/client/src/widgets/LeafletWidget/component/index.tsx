import { Colors } from "constants/Colors";
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";

import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { Icon, LatLngExpression } from "leaflet";
import { MarkerProps } from "../constants";

export interface LeafletComponentProps {
  lat: number;
  long: number;
  zoom: number;
  attribution: string;
  url: string;
  markerText: string;
  enableDrag: (e: any) => void;
  allowZoom: boolean;
  enablePickLocation: boolean;
  mapCenter: {
    lat: number;
    long: number;
    title?: string;
  };
  center?: {
    lat: number;
    long: number;
  };
  defaultMarkers?: Array<MarkerProps>;
  markers?: Array<MarkerProps>;
  selectedMarker?: {
    lat: number;
    long: number;
    title?: string;
    color?: string;
  };
  onMarkerClick?: string;
  onCreateMarker?: string;
  enableCreateMarker: boolean;
  enableReplaceMarker: boolean;
  clickedMarkerCentered?: boolean;
  updateCenter: (lat: number, long: number) => void;
  updateMarker: (lat: number, long: number, index: number) => void;
  saveMarker: (lat: number, long: number) => void;
  selectMarker: (lat: number, long: number, title: string) => void;
  unselectMarker: () => void;
  borderRadius: string;
  boxShadow?: string;
  widgetId: string;
}

const LeafletContainerWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const LeafletWrapper = styled.div<{
  borderRadius: string;
  boxShadow?: string;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};
  border: ${({ boxShadow }) =>
    boxShadow === "none" ? `1px solid` : `0px solid`};
  border-color: ${Colors.GREY_3};
  overflow: hidden;
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;

  ${({ borderRadius }) =>
    borderRadius >= "1.5rem"
      ? `& div.gmnoprint:not([data-control-width]) {
    margin-right: 10px !important;`
      : ""}
`;

function AddMarker(props: LeafletComponentProps) {
  const [position, setPosition] = useState([
    props.center?.lat,
    props.center?.long,
  ] as LatLngExpression);
  const map = useMapEvents({
    click(e) {
      if (props.enableCreateMarker) {
        props.saveMarker(e.latlng.lat, e.latlng.lng);
      }
      setPosition(e.latlng);
    },
  });

  map.flyTo(position, map.getZoom());

  return position === null ? null : (
    <Marker
      icon={
        new Icon({
          iconUrl: markerIconPng,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }
      position={position}
    >
      <Popup>You are here</Popup>
    </Marker>
  );
}

const MyLeafLetComponent = (props: any) => {
  const [mapCenter, setMapCenter] = React.useState<
    | {
        lat: number;
        lng: number;
        title?: string;
        description?: string;
      }
    | undefined
  >({
    ...props.center,
    lng: props.center.long,
  });
  useEffect(() => {
    if (!props.selectedMarker) {
      setMapCenter({
        ...props.center,
        lng: props.center.long,
      });
    }
  }, [props.center, props.selectedMarker]);
  return (
    <MapContainer
      center={mapCenter}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      zoom={props.zoom}
    >
      <TileLayer attribution={props.attribution} url={props.url} />
      {Array.isArray(props.markers) &&
        props.markers.map((marker: MarkerProps, index: number) => (
          <Marker
            eventHandlers={{
              click: () => {
                if (props.clickedMarkerCentered) {
                  setMapCenter({
                    ...marker,
                    lng: marker.long,
                  });
                }
                props.selectMarker(marker.lat, marker.long, marker.title);
              },
            }}
            icon={
              new Icon({
                iconUrl: markerIconPng,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })
            }
            key={index}
            position={[Number(marker.lat), Number(marker.long)]}
            title={marker.title}
          >
            <Popup>{props.markerText}</Popup>
          </Marker>
        ))}
      <AddMarker {...props} />
    </MapContainer>
  );
};

function LeafletComponent(props: LeafletComponentProps) {
  const LeafletContainerWrapperMemoized = useMemo(
    () => <LeafletContainerWrapper />,
    [props.borderRadius, props.boxShadow],
  );
  return (
    <LeafletWrapper
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
    >
      <MyLeafLetComponent
        containerElement={LeafletContainerWrapperMemoized}
        loadingElement={LeafletContainerWrapperMemoized}
        mapElement={LeafletContainerWrapperMemoized}
        {...props}
      />
    </LeafletWrapper>
  );
}

export default LeafletComponent;

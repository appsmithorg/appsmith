import { Colors } from "constants/Colors";
import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import styled from "styled-components";
import { AddScriptTo, ScriptStatus, useScript } from "utils/hooks/useScript";

export interface LeafletComponentProps {
  lat: number;
  long: number;
  zoom: number;
  markerText: string;
  enableDrag: (e: any) => void;
  borderRadius: string;
  boxShadow?: string;
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

function LeafletComponent(props: LeafletComponentProps) {
  const { lat, long, markerText, zoom } = props;
  const status = useScript("leaflet/dist/leaflet.css", AddScriptTo.HEAD);
  const LeafletContainerWrapperMemoized = useMemo(
    () => <LeafletContainerWrapper />,
    [props.borderRadius, props.boxShadow],
  );
  return (
    <LeafletWrapper
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      onMouseLeave={props.enableDrag}
    >
      {status === ScriptStatus.READY && (
        <MapContainer center={[lat, long]} scrollWheelZoom zoom={zoom}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, long]}>
            <Popup>{markerText}</Popup>
          </Marker>
        </MapContainer>
      )}
    </LeafletWrapper>
  );
}

export default LeafletComponent;

import React, { useEffect, useRef, useState } from "react";
import { MarkerProps } from "../constants";
import PickMyLocation from "./PickMyLocation";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const locations = [
  { lat: -31.56391, lng: 147.154312 },
  { lat: -33.718234, lng: 150.363181 },
  { lat: -33.727111, lng: 150.371124 },
  { lat: -33.848588, lng: 151.209834 },
  { lat: -33.851702, lng: 151.216968 },
  { lat: -34.671264, lng: 150.863657 },
  { lat: -35.304724, lng: 148.662905 },
  { lat: -36.817685, lng: 175.699196 },
  { lat: -36.828611, lng: 175.790222 },
  { lat: -37.75, lng: 145.116667 },
  { lat: -37.759859, lng: 145.128708 },
  { lat: -37.765015, lng: 145.133858 },
  { lat: -37.770104, lng: 145.143299 },
  { lat: -37.7737, lng: 145.145187 },
  { lat: -37.774785, lng: 145.137978 },
  { lat: -37.819616, lng: 144.968119 },
  { lat: -38.330766, lng: 144.695692 },
  { lat: -39.927193, lng: 175.053218 },
  { lat: -41.330162, lng: 174.865694 },
  { lat: -42.734358, lng: 147.439506 },
  { lat: -42.734358, lng: 147.501315 },
  { lat: -42.735258, lng: 147.438 },
  { lat: -43.999792, lng: 170.463352 },
];

const render = (status: any) => {
  switch (status) {
    case Status.LOADING:
      return "Loading...";
    case Status.FAILURE:
      return "Error in the component";
  }
};
function Map({
  center,
  enableSearch,
  updateCenter,
  zoom,
}: {
  center: google.maps.LatLngLiteral;
  zoom: number;
  updateCenter?: any;
  enableSearch: boolean;
}) {
  const ref = useRef();
  const searchBoxRef = useRef();
  const [markerPos, setMarkerPos] = useState<google.maps.LatLng>();
  useEffect(() => {
    const map = new window.google.maps.Map(ref?.current, {
      center: center ?? { lat: 29.7604, lng: 95.3698 },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoom,
    });

    // clustering functionality:
    const infoWindow = new google.maps.InfoWindow({
      content: "",
      disableAutoPan: true,
    });
    // Create an array of alphabetical characters used to label the markers.
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // Add some markers to the map.
    const markers = locations.map((position, i) => {
      const label = labels[i % labels.length];
      const marker = new google.maps.Marker({
        position,
        label,
      });

      // markers can only be keyboard focusable when they have click listeners
      // open info window when marker is clicked
      marker.addListener("click", () => {
        infoWindow.setContent(label);
        infoWindow.open(map, marker);
      });

      return marker;
    });
    new MarkerClusterer({ markers, map });

    // Add search box functionality:
    const searchBox = new google.maps.places.SearchBox(searchBoxRef.current);
    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();
      const location = places[0].geometry.location;
      if (location) {
        const lat = location.lat();
        const lng = location.lng();
        updateCenter(lat, lng);
        setMarkerPos({ lat, lng });
      }
    });
    google.maps.event.clearListeners(map, "click");
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      setMarkerPos(e.latLng);
    });

    new window.google.maps.Marker({
      position: markerPos ?? center,
      map: map,
    });
    // google.maps.event.clearListeners(marker, "click");
    // marker.addListener("click", () => {
    // });
  }, [center, markerPos, zoom]);

  return (
    <>
      <div id="map" ref={ref} />
      {enableSearch && (
        <StyledInput
          placeholder="Enter location to search"
          ref={searchBoxRef}
          type="text"
        />
      )}
    </>
  );
}
const WrapperComp = ({
  apiKey,
  center,
  enablePickLocation,
  enableSearch,
  updateCenter,
  zoomLevel,
}: {
  center?: {
    lat: number;
    lng: number;
  };
  updateCenter: (lat: number, lng: number) => void;
  zoomLevel: number;
  apiKey: string;
  enablePickLocation: boolean;
  enableSearch: boolean;
}) => (
  <Wrapper
    apiKey={apiKey}
    libraries={["geometry", "drawing", "places"]}
    render={render}
  >
    <Map
      center={center}
      enableSearch={enableSearch}
      updateCenter={updateCenter}
      zoom={zoomLevel}
    />
    {enablePickLocation && (
      <PickMyLocationWrapper allowZoom title="Pick My Location">
        <PickMyLocation updateCenter={updateCenter} />
      </PickMyLocationWrapper>
    )}
  </Wrapper>
);
interface MapComponentProps {
  apiKey: string;
  widgetId: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  enableSearch: boolean;
  zoomLevel: number;
  enablePickLocation: boolean;
  allowZoom: boolean;
  center: {
    lat: number;
    lng: number;
  };
  markers?: Array<MarkerProps>;
  selectedMarker?: {
    lat: number;
    lng: number;
    title?: string;
  };
  enableCreateMarker: boolean;
  clickedMarkerCentered?: boolean;
  updateCenter: (lat: number, lng: number) => void;
  updateMarker: (lat: number, lng: number, index: number) => void;
  saveMarker: (lat: number, lng: number) => void;
  selectMarker: (lat: number, lng: number, title: string) => void;
  enableDrag: (e: any) => void;
  unselectMarker: () => void;
  borderRadius: string;
  boxShadow?: string;
}
// const MapContainerWrapper = styled.div`
//   width: 100%;
//   height: 100%;
// `;
// const MapWrapper = styled.div<{
//   borderRadius: string;
//   boxShadow?: string;
// }>`
//   position: relative;
//   width: 100%;
//   height: 100%;
//   border-radius: ${({ borderRadius }) => borderRadius};
//   border: ${({ boxShadow }) =>
//     boxShadow === "none" ? `1px solid` : `0px solid`};
//   border-color: ${Colors.GREY_3};
//   overflow: hidden;
//   box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
//   ${({ borderRadius }) =>
//     borderRadius >= "1.5rem"
//       ? `& div.gmnoprint:not([data-control-width]) {
//     margin-right: 10px !important;`
//       : ""}
// `;
const StyledInput = styled.input`
  position: absolute;
  top: 0%;
  left: 34%;
  box-sizing: border-box;
  border: 1px solid transparent;
  width: 240px;
  height: 32px;
  margin-top: 27px;
  padding: 0 12px;
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  outline: none;
  text-overflow: ellipses;
`;
type PickMyLocationProps = {
  allowZoom: boolean;
};
const PickMyLocationWrapper = styled.div<PickMyLocationProps>`
  position: absolute;
  bottom: ${(props) => (props.allowZoom ? 110 : 20)}px;
  right: -90px;
  width: 140px !important;
  height: 40px !important;
`;
function MapComponent(props: MapComponentProps) {
  return (
    <WrapperComp
      apiKey={props.apiKey}
      center={props.center}
      enablePickLocation={props.enablePickLocation}
      enableSearch={props.enableSearch}
      updateCenter={props.updateCenter}
      zoomLevel={Math.floor(props.zoomLevel / 5)}
    />
  );
}
export default MapComponent;

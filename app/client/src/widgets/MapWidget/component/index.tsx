import React, { useEffect, useRef, useState } from "react";
import { MarkerProps } from "../constants";
import PickMyLocation from "./PickMyLocation";
import styled from "styled-components";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return <span>Loading...</span>;
    case Status.FAILURE:
      return <span>Error in the component</span>;
    case Status.SUCCESS:
      return <span>Component loaded....</span>;
  }
};
function Map({
  center,
  clickedMarkerCentered,
  enableSearch,
  updateCenter,
  zoom,
}: {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  updateCenter?: any;
  enableSearch: boolean;
  clickedMarkerCentered?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjectRef = useRef<google.maps.Map>();
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const searchBoxObjRef = useRef<google.maps.places.SearchBox>();
  const [markerPos, setMarkerPos] = useState<google.maps.LatLng>();

  useEffect(() => {
    /**
     * This effect will initialize All the refs with google maps objects.
     * TODO: Instead of initializing to refs, create a class to load these objects.
     */
    if (window && window.google && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      mapObjectRef.current = map;

      if (searchBoxRef.current) {
        const searchBox = new window.google.maps.places.SearchBox(
          searchBoxRef.current,
        );
        searchBoxObjRef.current = searchBox;
      }
    }
  }, []);

  useEffect(() => {
    // Fix typing here
    mapObjectRef.current?.setCenter((center as unknown) as google.maps.LatLng);
  }, [center.lat, center.lng]);

  useEffect(() => {
    mapObjectRef.current?.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    // Add search box functionality:
    searchBoxObjRef.current?.addListener("places_changed", () => {
      const places:
        | google.maps.places.PlaceResult[]
        | undefined = searchBoxObjRef.current?.getPlaces();
      const location = places ? places[0].geometry?.location : undefined;
      if (location) {
        const lat = location.lat();
        const long = location.lng();
        updateCenter(lat, long);
        setMarkerPos(new google.maps.LatLng(lat, long));
      }
    });
    mapObjectRef.current?.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => e && e.latLng && setMarkerPos(e.latLng),
    );

    // We need to create new marker every time a location is loaded or the map is clicked.
    const marker = new window.google.maps.Marker({
      position: markerPos ?? center,
      map: mapObjectRef.current,
    });

    marker.addListener("click", (e: any) => {
      if (clickedMarkerCentered) {
        mapObjectRef.current?.setCenter(e.latLng);
      }
    });
    return () => {
      mapObjectRef.current &&
        google.maps.event.clearListeners(mapObjectRef.current, "click");
      searchBoxObjRef.current &&
        google.maps.event.clearListeners(
          searchBoxObjRef.current,
          "places_changed",
        );
    };
  }, [
    markerPos?.lat,
    markerPos?.lng,
    center.lng,
    center.lat,
    clickedMarkerCentered,
  ]);

  return (
    <>
      <div id="map" ref={mapRef} />
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
  clickedMarkerCentered,
  enablePickLocation,
  enableSearch,
  updateCenter,
  zoomLevel,
}: {
  center: {
    lat: number;
    long: number;
  };
  updateCenter: (lat: number, long: number) => void;
  zoomLevel: number;
  apiKey: string;
  enablePickLocation: boolean;
  enableSearch: boolean;
  clickedMarkerCentered?: boolean;
}) => (
  <Wrapper
    apiKey={apiKey}
    libraries={["geometry", "drawing", "places"]}
    render={render}
  >
    <Map
      center={{ lng: center.long, lat: center.lat }}
      clickedMarkerCentered={clickedMarkerCentered}
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
    long: number;
  };
  markers?: Array<MarkerProps>;
  selectedMarker?: {
    lat: number;
    long: number;
    title?: string;
  };
  enableCreateMarker: boolean;
  clickedMarkerCentered?: boolean;
  updateCenter: (lat: number, long: number) => void;
  updateMarker: (lat: number, long: number, index: number) => void;
  saveMarker: (lat: number, long: number) => void;
  selectMarker: (lat: number, long: number, title: string) => void;
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
      clickedMarkerCentered={props.clickedMarkerCentered}
      enablePickLocation={props.enablePickLocation}
      enableSearch={props.enableSearch}
      updateCenter={props.updateCenter}
      zoomLevel={Math.floor(props.zoomLevel / 5)}
    />
  );
}
export default MapComponent;

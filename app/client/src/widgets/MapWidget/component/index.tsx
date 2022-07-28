import React, { useEffect, useMemo } from "react";
import { withGoogleMap, GoogleMap, Marker } from "react-google-maps";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import { MarkerProps } from "../constants";
import PickMyLocation from "./PickMyLocation";
import styled from "styled-components";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";
import { Colors } from "constants/Colors";

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

const MapContainerWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const MapWrapper = styled.div<{
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

const StyledInput = styled.input`
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
  width: 140px;
`;

const MyMapComponent = withGoogleMap((props: any) => {
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
  const searchBox = React.createRef<SearchBox>();
  const onPlacesChanged = () => {
    const node: any = searchBox.current;
    if (node) {
      const places: any = node.getPlaces();
      if (
        places &&
        places.length &&
        places[0].geometry &&
        places[0].geometry.location
      ) {
        const location = places[0].geometry.location;
        const lat = location.lat();
        const long = location.lng();
        setMapCenter({ lat, lng: long });
        props.updateCenter(lat, long, places[0].formatted_address);
        props.unselectMarker();
      }
    }
  };
  useEffect(() => {
    if (!props.selectedMarker) {
      setMapCenter({
        ...props.center,
        lng: props.center.long,
      });
    }
  }, [props.center, props.selectedMarker]);
  return (
    <GoogleMap
      center={mapCenter}
      onClick={(e) => {
        if (props.enableCreateMarker) {
          props.saveMarker(e.latLng.lat(), e.latLng.lng());
        }
      }}
      options={{
        zoomControl: props.allowZoom,
        fullscreenControl: false,
        mapTypeControl: false,
        scrollwheel: false,
        rotateControl: false,
        streetViewControl: false,
      }}
      zoom={props.zoom}
    >
      {props.enableSearch && (
        <SearchBox
          controlPosition={2}
          onPlacesChanged={onPlacesChanged}
          ref={searchBox}
        >
          <StyledInput placeholder="Enter location to search" type="text" />
        </SearchBox>
      )}
      {Array.isArray(props.markers) &&
        props.markers.map((marker: MarkerProps, index: number) => (
          <Marker
            clickable
            draggable={
              props.selectedMarker &&
              props.selectedMarker.lat === marker.lat &&
              props.selectedMarker.long === marker.long
            }
            icon={{
              path:
                "M12 23.728L5.636 17.364C4.37734 16.1054 3.52019 14.5017 3.17293 12.7559C2.82567 11.0101 3.00391 9.20047 3.6851 7.55595C4.36629 5.91142 5.51984 4.50582 6.99988 3.51689C8.47992 2.52796 10.22 2.00012 12 2.00012C13.78 2.00012 15.5201 2.52796 17.0001 3.51689C18.4802 4.50582 19.6337 5.91142 20.3149 7.55595C20.9961 9.20047 21.1743 11.0101 20.8271 12.7559C20.4798 14.5017 19.6227 16.1054 18.364 17.364L12 23.728ZM10.5858 12.4143C10.9609 12.7893 11.4696 13 12 13C12.5304 13 13.0391 12.7893 13.4142 12.4143C13.7893 12.0392 14 11.5305 14 11C14 10.4696 13.7893 9.9609 13.4142 9.58583C13.0391 9.21076 12.5304 9.00004 12 9.00004C11.4696 9.00004 10.9609 9.21076 10.5858 9.58583C10.2107 9.9609 10 10.4696 10 11C10 11.5305 10.2107 12.0392 10.5858 12.4143Z",
              fillColor: marker.color || "#ea4335",
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1,
              anchor: new google.maps.Point(12, 24),
            }}
            key={index}
            onClick={() => {
              if (props.clickedMarkerCentered) {
                setMapCenter({
                  ...marker,
                  lng: marker.long,
                });
              }

              props.selectMarker(marker.lat, marker.long, marker.title);
            }}
            onDragEnd={(de) => {
              props.updateMarker(de.latLng.lat(), de.latLng.lng(), index);
            }}
            position={{ lat: Number(marker.lat), lng: Number(marker.long) }}
            title={marker.title}
          />
        ))}
      {props.enablePickLocation && (
        <PickMyLocationWrapper
          allowZoom={props.allowZoom}
          title="Pick My Location"
        >
          <PickMyLocation updateCenter={props.updateCenter} />
        </PickMyLocationWrapper>
      )}
    </GoogleMap>
  );
});

function MapComponent(props: MapComponentProps) {
  const zoom = Math.floor(props.zoomLevel / 5);
  const status = useScript(
    `https://maps.googleapis.com/maps/api/js?key=${props.apiKey}&v=3.exp&libraries=geometry,drawing,places`,
    AddScriptTo.HEAD,
  );
  const MapContainerWrapperMemoized = useMemo(() => <MapContainerWrapper />, [
    props.borderRadius,
    props.boxShadow,
  ]);

  return (
    <MapWrapper
      borderRadius={props.borderRadius}
      boxShadow={props.boxShadow}
      onMouseLeave={props.enableDrag}
    >
      {status === ScriptStatus.READY && (
        <MyMapComponent
          containerElement={MapContainerWrapperMemoized}
          loadingElement={MapContainerWrapperMemoized}
          mapElement={MapContainerWrapperMemoized}
          {...props}
          zoom={zoom}
        />
      )}
    </MapWrapper>
  );
}

export default MapComponent;

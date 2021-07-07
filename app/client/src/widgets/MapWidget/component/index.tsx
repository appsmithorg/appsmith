import React, { useEffect } from "react";
import { withGoogleMap, GoogleMap, Marker } from "react-google-maps";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import { MarkerProps } from "../constants";
import PickMyLocation from "./PickMyLocation";
import styled from "styled-components";
import { useScript, ScriptStatus, AddScriptTo } from "utils/hooks/useScript";
import { getBorderCSSShorthand } from "constants/DefaultTheme";

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
  updateCenter: (lat: number, long: number) => void;
  updateMarker: (lat: number, long: number, index: number) => void;
  saveMarker: (lat: number, long: number) => void;
  selectMarker: (lat: number, long: number, title: string) => void;
  enableDrag: (e: any) => void;
  unselectMarker: () => void;
}

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
  border-radius: 0;
`;

const MapContainerWrapper = styled.div`
  width: 100%;
  height: 100%;
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
        props.updateCenter(lat, long);
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
            key={index}
            onClick={() => {
              setMapCenter({
                ...marker,
                lng: marker.long,
              });
              props.selectMarker(marker.lat, marker.long, marker.title);
            }}
            onDragEnd={(de) => {
              props.updateMarker(de.latLng.lat(), de.latLng.lng(), index);
            }}
            position={{ lat: marker.lat, lng: marker.long }}
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
  return (
    <MapWrapper onMouseLeave={props.enableDrag}>
      {status === ScriptStatus.READY && (
        <MyMapComponent
          containerElement={<MapContainerWrapper />}
          loadingElement={<MapContainerWrapper />}
          mapElement={<MapContainerWrapper />}
          {...props}
          zoom={zoom}
        />
      )}
    </MapWrapper>
  );
}

export default MapComponent;

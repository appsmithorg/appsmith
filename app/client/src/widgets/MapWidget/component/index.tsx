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
            icon={{
              path:
                "M9 19.4225L13.95 14.4725C14.9289 13.4935 15.5955 12.2462 15.8656 10.8884C16.1356 9.53053 15.9969 8.1231 15.4671 6.84406C14.9373 5.56502 14.04 4.47181 12.8889 3.70267C11.7378 2.93353 10.3844 2.52301 9 2.52301C7.61557 2.52301 6.26222 2.93353 5.11109 3.70267C3.95996 4.47181 3.06275 5.56502 2.53292 6.84406C2.00308 8.1231 1.86442 9.53053 2.13445 10.8884C2.40449 12.2462 3.07111 13.4935 4.05 14.4725L9 19.4225ZM9 22.2505L2.636 15.8865C1.37734 14.6278 0.520187 13.0242 0.172928 11.2784C-0.17433 9.53253 0.00390685 7.72293 0.685099 6.07841C1.36629 4.43388 2.51984 3.02828 3.99988 2.03935C5.47992 1.05042 7.21998 0.522583 9 0.522583C10.78 0.522583 12.5201 1.05042 14.0001 2.03935C15.4802 3.02828 16.6337 4.43388 17.3149 6.07841C17.9961 7.72293 18.1743 9.53253 17.8271 11.2784C17.4798 13.0242 16.6227 14.6278 15.364 15.8865L9 22.2505ZM9 11.5225C9.53044 11.5225 10.0391 11.3118 10.4142 10.9367C10.7893 10.5616 11 10.0529 11 9.5225C11 8.99207 10.7893 8.48336 10.4142 8.10829C10.0391 7.73322 9.53044 7.5225 9 7.5225C8.46957 7.5225 7.96086 7.73322 7.58579 8.10829C7.21072 8.48336 7 8.99207 7 9.5225C7 10.0529 7.21072 10.5616 7.58579 10.9367C7.96086 11.3118 8.46957 11.5225 9 11.5225ZM9 13.5225C7.93914 13.5225 6.92172 13.1011 6.17158 12.3509C5.42143 11.6008 5 10.5834 5 9.5225C5 8.46164 5.42143 7.44422 6.17158 6.69408C6.92172 5.94393 7.93914 5.5225 9 5.5225C10.0609 5.5225 11.0783 5.94393 11.8284 6.69408C12.5786 7.44422 13 8.46164 13 9.5225C13 10.5834 12.5786 11.6008 11.8284 12.3509C11.0783 13.1011 10.0609 13.5225 9 13.5225Z",
              fillColor: marker.color || "#E0DEDE",
              fillOpacity: 1,
              strokeWeight: 1,
              scale: 1,
            }}
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

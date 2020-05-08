import React from "react";
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import { MarkerProps } from "widgets/MapWidget";
import { ControlIcons } from "icons/ControlIcons";
import styled, { AnyStyledComponent } from "styled-components";

interface MapComponentProps {
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
  disableDrag: (e: any) => void;
}

const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
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
  bottom: ${props => (props.allowZoom ? 110 : 20)}px;
  right: -95px;
  width: 140px;
`;

const StyledPickMyLocationIcon = styled(
  ControlIcons.PICK_MY_LOCATION_CONTROL as AnyStyledComponent,
)`
  position: relative;
  cursor: pointer;
`;

const MyMapComponent = withScriptjs(
  withGoogleMap((props: any) => (
    <GoogleMap
      options={{
        zoomControl: props.allowZoom,
        fullscreenControl: false,
        mapTypeControl: false,
        scrollwheel: false,
        rotateControl: false,
        streetViewControl: false,
      }}
      zoom={props.zoom}
      center={{ ...props.center, lng: props.center.long }}
      onClick={e => {
        if (props.enableCreateMarker) {
          props.saveMarker(e.latLng.lat(), e.latLng.lng());
        }
      }}
    >
      {props.enableSearch && (
        <SearchBox
          controlPosition={2}
          onPlacesChanged={props.onPlacesChanged}
          ref={props.onSearchBoxMounted}
        >
          <StyledInput type="text" placeholder="Enter location to search" />
        </SearchBox>
      )}
      {props.markers.map((marker: any, index: number) => (
        <Marker
          key={index}
          title={marker.title}
          position={{ lat: marker.lat, lng: marker.long }}
          clickable
          draggable={
            props.selectedMarker &&
            props.selectedMarker.lat === marker.lat &&
            props.selectedMarker.long === marker.long
          }
          onClick={e => {
            props.selectMarker(marker.lat, marker.long, marker.title);
          }}
          onDragEnd={de => {
            props.updateMarker(de.latLng.lat(), de.latLng.lng(), index);
          }}
        />
      ))}
      {props.enablePickLocation && (
        <PickMyLocationWrapper
          onClick={e => {
            props.getUserLocation();
            e.stopPropagation();
          }}
          title="Pick My Location"
          allowZoom={props.allowZoom}
        >
          <StyledPickMyLocationIcon />
        </PickMyLocationWrapper>
      )}
    </GoogleMap>
  )),
);

class MapComponent extends React.Component<MapComponentProps> {
  private searchBox = React.createRef<SearchBox>();

  onSearchBoxMounted = (ref: any) => {
    this.searchBox = ref;
  };
  onPlacesChanged = () => {
    const node: any = this.searchBox;
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
        this.props.updateCenter(lat, long);
      }
    }
  };

  getUserLocation = () => {
    if ("geolocation" in navigator) {
      return navigator.geolocation.getCurrentPosition(data => {
        const {
          coords: { latitude: lat, longitude: long },
        } = data;
        this.props.updateCenter(lat, long);
      });
    }
  };

  render() {
    const zoom = Math.floor(this.props.zoomLevel / 5);
    return (
      <MapWrapper onMouseLeave={this.props.disableDrag}>
        <MyMapComponent
          googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyC2H_twoNbEKMm9Q0nYAh7715Dplg2asCI&v=3.exp&libraries=geometry,drawing,places"
          loadingElement={<MapContainerWrapper />}
          containerElement={<MapContainerWrapper />}
          mapElement={<MapContainerWrapper />}
          {...this.props}
          zoom={zoom}
          onPlacesChanged={this.onPlacesChanged}
          onSearchBoxMounted={this.onSearchBoxMounted}
          getUserLocation={this.getUserLocation}
        />
      </MapWrapper>
    );
  }
}

export default MapComponent;

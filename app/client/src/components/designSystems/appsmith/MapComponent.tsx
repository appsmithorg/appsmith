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
    lng: number;
  };
  markers?: Array<MarkerProps>;
  selectedMarker?: {
    lat: number;
    long: number;
    title?: string;
  };
  enableCreateMarker: boolean;
  updateCenter: (lat: number, lng: number) => void;
  updateMarker: (lat: number, lng: number, index: number) => void;
  saveMarker: (lat: number, lng: number) => void;
  selectMarker: (lat: number, lng: number, title: string) => void;
}

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
      center={props.center}
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
          position={{ lat: marker.lat, lng: marker.lng }}
          clickable
          draggable={
            props.selectedMarker &&
            props.selectedMarker.lat === marker.lat &&
            props.selectedMarker.long === marker.lng
          }
          onClick={e => {
            props.selectMarker(marker.lat, marker.lng, marker.title);
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
        const lng = location.lng();
        this.props.updateCenter(lat, lng);
      }
    }
  };

  getUserLocation = () => {
    if ("geolocation" in navigator) {
      return navigator.geolocation.getCurrentPosition(data => {
        const {
          coords: { latitude: lat, longitude: lng },
        } = data;
        this.props.saveMarker(lat, lng);
      });
    }
  };

  render() {
    const zoom = Math.floor(this.props.zoomLevel / 5);
    return (
      <MyMapComponent
        googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyC2H_twoNbEKMm9Q0nYAh7715Dplg2asCI&v=3.exp&libraries=geometry,drawing,places"
        loadingElement={<div style={{ height: `100%` }} />}
        containerElement={<div style={{ height: `100%` }} />}
        mapElement={<div style={{ height: `100%` }} />}
        {...this.props}
        zoom={zoom}
        onPlacesChanged={this.onPlacesChanged}
        onSearchBoxMounted={this.onSearchBoxMounted}
        getUserLocation={this.getUserLocation}
      />
    );
  }
}

export default MapComponent;

import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import StandaloneSearchBox from "react-google-maps/lib/components/places/StandaloneSearchBox";
const { compose, withProps, lifecycle } = require("recompose");
const { withScriptjs } = require("react-google-maps");

const StyledInput = styled.input`
  box-sizing: border-box;
  border: 1px solid transparent;
  width: 100%;
  height: 32px;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 14px;
  outline: none;
  text-overflow: ellipses;
  background: #272821;
  color: ${props => props.theme.colors.textOnDarkBG};
`;

interface StandaloneSearchBoxProps {
  onSearchBoxMounted: (ref: any) => void;
  onPlacesChanged: () => void;
}

const PlacesWithStandaloneSearchBox = compose(
  withProps({
    googleMapURL:
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyC2H_twoNbEKMm9Q0nYAh7715Dplg2asCI&v=3.exp&libraries=geometry,drawing,places",
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `400px` }} />,
  }),
  lifecycle({
    componentWillMount() {
      let searchBox: any = React.createRef<SearchBox>();
      this.setState({
        places: [],
        onSearchBoxMounted: (ref: any) => {
          searchBox = ref;
        },
        onPlacesChanged: () => {
          if (searchBox === null) return;
          if (searchBox.getPlaces === null) return;
          const places = searchBox.getPlaces();
          this.setState({
            places,
          });
          this.props.onLocationSelection(places);
        },
      });
    },
  }),
  withScriptjs,
)((props: any) => (
  <div data-standalone-searchbox="">
    <StandaloneSearchBox
      ref={props.onSearchBoxMounted}
      onPlacesChanged={props.onPlacesChanged}
    >
      <StyledInput type="text" placeholder="Enter location" />
    </StandaloneSearchBox>
  </div>
));

class LocationSearchControl extends BaseControl<ControlProps> {
  onLocationSelection = (
    places: Array<{
      geometry: { location: { lat: () => number; lng: () => number } };
    }>,
  ) => {
    const location = places[0].geometry.location;
    const lat = location.lat();
    const long = location.lng();
    const value = { lat, long };
    this.updateProperty(this.props.propertyName, value);
  };
  render() {
    return (
      <PlacesWithStandaloneSearchBox
        onLocationSelection={this.onLocationSelection}
      />
    );
  }

  static getControlType() {
    return "LOCATION_SEARCH";
  }
}

export default LocationSearchControl;

import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import SearchBox from "react-google-maps/lib/components/places/SearchBox";
import StandaloneSearchBox from "react-google-maps/lib/components/places/StandaloneSearchBox";
import { getAppsmithConfigs } from "configs";

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

const { google } = getAppsmithConfigs();

class LocationSearchControl extends BaseControl<ControlProps> {
  searchBox: any = null;
  state: any = { title: "" };

  handleChange = (ev: any) => {
    const val = ev.target.value;
    this.setState({ title: val });
  };

  onLocationSelection = () => {
    const places = this.searchBox.getPlaces();
    const location = places[0].geometry.location;
    const title = places[0].formatted_address;
    const lat = location.lat();
    const long = location.lng();
    const value = { lat, long, title };
    this.updateProperty(this.props.propertyName, value);
    this.setState({ title: title });
  };

  onSearchBoxMounted = (ref: SearchBox) => {
    this.searchBox = ref;
  };

  render() {
    // Todo: figure out why there's a race here.
    if (!window.google) return null;
    return (
      <div data-standalone-searchbox="">
        <StandaloneSearchBox
          ref={this.onSearchBoxMounted}
          onPlacesChanged={this.onLocationSelection}
        >
          <StyledInput
            type="text"
            placeholder="Enter location"
            value={this.state.title || this.props.propertyValue.title}
            onChange={this.handleChange}
          />
        </StandaloneSearchBox>
      </div>
    );
  }

  static getControlType() {
    return "LOCATION_SEARCH";
  }
}

export default LocationSearchControl;

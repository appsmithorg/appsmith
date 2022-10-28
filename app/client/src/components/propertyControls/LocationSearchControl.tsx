import React, { useState } from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import { getAppsmithConfigs } from "@appsmith/configs";
import { StyledInputGroup } from "./StyledControls";
import log from "loglevel";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

const { google } = getAppsmithConfigs();

const render = (status: any) => {
  switch (status) {
    case Status.LOADING:
      return "Loading...";
    case Status.FAILURE:
      return "Error in the component";
  }
};
class LocationSearchControl extends BaseControl<ControlProps> {
  clearLocation = () => {
    this.updateProperty(this.props.propertyName, {
      lat: -34.397,
      lng: 150.644,
      title: "",
    });
  };

  onLocationSelection = (ref: any) => {
    try {
      // For some places, the length is zero
      const places = ref.getPlaces();
      const location = places[0].geometry.location;
      const title = places[0].formatted_address;
      const lat = location.lat();
      const lng = location.lng();
      const value = { lat, lng, title };
      this.updateProperty(this.props.propertyName, value, true);
    } catch (e) {
      if (ref && ref.getPlaces)
        log.debug("Error selecting location:", ref.getPlaces());
      else {
        log.debug("Error selecting location - searchBox not found");
      }
    }
  };

  onSearchBoxMounted = (ref: any) => {
    if (window) {
      const searchBox = new window.google.maps.places.SearchBox(ref);
      searchBox.addListener("places_changed", () => {
        this.onLocationSelection(searchBox);
      });
    }
  };

  render() {
    return (
      <Wrapper
        apiKey={google.apiKey}
        libraries={["geometry", "drawing", "places"]}
        render={render}
      >
        <MapScriptWrapper
          clearLocation={this.clearLocation}
          onSearchBoxMounted={this.onSearchBoxMounted}
          propertyValue={this.props.propertyValue}
        />
      </Wrapper>
    );
  }

  static getControlType() {
    return "LOCATION_SEARCH";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

interface MapScriptWrapperProps {
  onSearchBoxMounted: (ref: any) => void;
  clearLocation: () => void;
  propertyValue: any;
}

function MapScriptWrapper(props: MapScriptWrapperProps) {
  const [title, setTitle] = useState("");

  return (
    <div data-standalone-searchbox="">
      <StyledInputGroup
        dataType="text"
        defaultValue={title || props.propertyValue?.title}
        onChange={(value: string) => {
          if (value === "") {
            props.clearLocation();
          }
          setTitle(value);
        }}
        placeholder="Enter location"
        ref={props.onSearchBoxMounted}
        tabIndex={-1}
      />
    </div>
  );
}

export default LocationSearchControl;

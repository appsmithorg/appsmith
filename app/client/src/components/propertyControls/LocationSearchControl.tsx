import log from "loglevel";
import React, { useState } from "react";
import styled from "styled-components";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

import { InputGroup } from "./StyledControls";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";

const MapStatusText = styled.span`
  font-size: 14px;
`;

const renderMapStatus = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return <MapStatusText>Loading...</MapStatusText>;
    case Status.FAILURE:
      return <MapStatusText>Error in the component</MapStatusText>;
    case Status.SUCCESS:
      return <MapStatusText>Component loaded....</MapStatusText>;
  }
};

class LocationSearchControl extends BaseControl<ControlProps> {
  clearLocation = () => {
    this.updateProperty(this.props.propertyName, {
      lat: -34.397,
      long: 150.644,
      title: "",
    });
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLocationSelection = (ref: any) => {
    try {
      // For some places, the length is zero
      const places = ref.getPlaces();
      const location = places[0].geometry.location;
      const title = places[0].formatted_address;
      const lat = location.lat();
      const long = location.lng();
      const value = { lat, long, title };

      this.updateProperty(this.props.propertyName, value, true);
    } catch (e) {
      if (ref && ref.getPlaces)
        log.debug("Error selecting location:", ref.getPlaces());
      else {
        log.debug("Error selecting location - searchBox not found");
      }
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        apiKey={this.props.widgetProperties.googleMapsApiKey}
        libraries={["geometry", "drawing", "places"]}
        render={renderMapStatus}
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isDynamicValue(value);
  }
}

interface MapScriptWrapperProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearchBoxMounted: (ref: any) => void;
  clearLocation: () => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  propertyValue: any;
}

function MapScriptWrapper(props: MapScriptWrapperProps) {
  const [title, setTitle] = useState("");

  return (
    <div data-standalone-searchbox="">
      <InputGroup
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

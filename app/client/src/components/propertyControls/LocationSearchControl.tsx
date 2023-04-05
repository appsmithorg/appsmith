import log from "loglevel";
import useInteractionAnalyticsEvent from "utils/hooks/useInteractionAnalyticsEvent";
import { Input } from "design-system";
import React, { useState, useRef, useEffect } from "react";
import type { TextInputProps } from "design-system-old";
import styled from "styled-components";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

// import { StyledInputGroup } from "./StyledControls";
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

const StyledInputGroup = React.forwardRef((props: TextInputProps, ref) => {
  let inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLInputElement>(null);
  const { dispatchInteractionAnalyticsEvent } =
    useInteractionAnalyticsEvent<HTMLInputElement>(false, wrapperRef);

  if (ref) inputRef = ref as React.RefObject<HTMLInputElement>;

  useEffect(() => {
    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const handleKeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (document.activeElement === wrapperRef?.current) {
          dispatchInteractionAnalyticsEvent({ key: e.key });
          inputRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Escape":
        if (document.activeElement === inputRef?.current) {
          dispatchInteractionAnalyticsEvent({ key: e.key });
          wrapperRef?.current?.focus();
          e.preventDefault();
        }
        break;
      case "Tab":
        if (document.activeElement === wrapperRef?.current) {
          dispatchInteractionAnalyticsEvent({
            key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
          });
        }
        break;
    }
  };

  return (
    <div className="w-full" ref={wrapperRef} tabIndex={0}>
      <Input ref={inputRef} {...props} size="md" tabIndex={-1} />
    </div>
  );
});

StyledInputGroup.displayName = "StyledInputGroup";

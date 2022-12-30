import React from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

import Map from "./Map";

export interface MarkerProps {
  lat: number;
  long: number;
  title?: string;
  description?: string;
  color?: string;
}
export interface MapComponentProps {
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
  markers?: MarkerProps[];
  selectedMarker?: {
    lat: number;
    long: number;
    title?: string;
  };
  enableCreateMarker: boolean;
  clickedMarkerCentered?: boolean;
  updateCenter: (lat?: number, long?: number) => void;
  updateMarker: (lat: number, long: number, index: number) => void;
  saveMarker: (lat?: number, long?: number) => void;
  selectMarker: (lat?: number, long?: number, title?: string) => void;
  enableDrag: (e: any) => void;
  unselectMarker: () => void;
  borderRadius: string;
  boxShadow?: string;
}

/**
 * This component will render the map based on the status of the google maps api.
 *
 * @param status
 * @returns
 */
const renderMapStatus = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return <span>Loading...</span>;
    case Status.FAILURE:
      return <span>Error in the component</span>;
    case Status.SUCCESS:
      return <span>Component loaded....</span>;
  }
};

const MapComponent = (props: MapComponentProps) => {
  const {
    allowZoom,
    apiKey,
    enablePickLocation,
    enableSearch,
    updateCenter,
    ...rest
  } = props;

  return (
    <Wrapper
      apiKey={apiKey}
      libraries={["geometry", "drawing", "places"]}
      render={renderMapStatus}
    >
      <Map updateCenter={updateCenter} {...rest}>
        <Map.PickMyLocation
          allowZoom={allowZoom}
          isEnabled={enablePickLocation}
          title="Pick My Location"
          updateCenter={updateCenter}
        />
        <Map.SearchBox
          isEnabled={enableSearch}
          placeholder="Enter location to search"
          updateCenter={updateCenter}
        />
      </Map>
    </Wrapper>
  );
};

export default MapComponent;

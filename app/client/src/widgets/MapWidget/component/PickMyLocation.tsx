import React from "react";
import styled from "styled-components";
import { Button } from "design-system";

const ControlButton = styled(Button)<{
  allowZoom?: boolean;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  right: 10px;
  bottom: ${(props) => (props.allowZoom ? "110px" : "20px")};
  position: absolute;
`;

interface PickMyLocationProps {
  title?: string;
  isEnabled?: boolean;
  allowZoom?: boolean;
  updateCenter: (lat: number, long: number) => void;
}

const PickMyLocation: React.FC<PickMyLocationProps> = (props) => {
  const { allowZoom, isEnabled, updateCenter } = props;
  const [clicked, setClicked] = React.useState(false);
  const [selected, setSelected] = React.useState(false);

  /**
   * get user location
   *
   * @returns
   */
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      return navigator.geolocation.getCurrentPosition((data) => {
        const {
          coords: { latitude: lat, longitude: long },
        } = data;
        setSelected(true);
        updateCenter(lat, long);
      });
    }
  };

  if (!isEnabled) return null;

  return (
    <ControlButton
      allowZoom={allowZoom}
      color={selected ? "var(--ads-v2-color-fg-information)" : "inherit"}
      isIconButton
      kind="secondary"
      onClick={() => {
        if (!(clicked && selected)) {
          setClicked(true);
          getUserLocation();
        }
      }}
      startIcon="pick-my-location-selected-control"
    />
  );
};

export default PickMyLocation;

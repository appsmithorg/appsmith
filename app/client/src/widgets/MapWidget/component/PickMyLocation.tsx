import React from "react";
import styled from "styled-components";

import { ControlIcons } from "icons/ControlIcons";

const Icon = styled(ControlIcons.PICK_MY_LOCATION_SELECTED_CONTROL)<{
  allowZoom?: boolean;
}>`
  background: white;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
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
  const { allowZoom, isEnabled, title, updateCenter } = props;
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
    <Icon
      allowZoom={allowZoom}
      color={selected ? "#049ADA" : clicked ? "#666666" : "#999999"}
      onClick={() => {
        if (!(clicked && selected)) {
          setClicked(true);
          getUserLocation();
        }
      }}
      title={title}
    />
  );
};

export default PickMyLocation;

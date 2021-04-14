import React from "react";
import { ControlIcons } from "icons/ControlIcons";
import styled, { AnyStyledComponent } from "styled-components";

const StyledPickMyLocationSelectedIcon = styled(
  ControlIcons.PICK_MY_LOCATION_SELECTED_CONTROL as AnyStyledComponent,
)`
  position: relative;
  cursor: pointer;
  height: 28px;
  width: 28px;
`;

const PickMyLocationIconWrapper = styled.div`
  background: white;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: rgba(0, 0, 0, 0.3) 0px 1px 4px -1px;
`;

interface PickMyLocationProps {
  updateCenter: (lat: number, long: number) => void;
}

interface PickMyLocationState {
  clicked: boolean;
  selected: boolean;
}
export default class PickMyLocation extends React.Component<
  PickMyLocationProps,
  PickMyLocationState
> {
  constructor(props: PickMyLocationProps) {
    super(props);
    this.state = {
      selected: false,
      clicked: false,
    };
  }
  getUserLocation = () => {
    if ("geolocation" in navigator) {
      return navigator.geolocation.getCurrentPosition((data) => {
        const {
          coords: { latitude: lat, longitude: long },
        } = data;
        this.setState({ selected: true });
        this.props.updateCenter(lat, long);
      });
    }
  };
  render() {
    return (
      <PickMyLocationIconWrapper>
        <StyledPickMyLocationSelectedIcon
          color={
            this.state.selected
              ? "#049ADA"
              : this.state.clicked
              ? "#666666"
              : "#999999"
          }
          onClick={() => {
            if (!(this.state.clicked && this.state.selected)) {
              this.setState({ clicked: true });
              this.getUserLocation();
            }
          }}
        />
      </PickMyLocationIconWrapper>
    );
  }
}

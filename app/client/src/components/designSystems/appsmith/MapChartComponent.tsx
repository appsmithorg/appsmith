import React from "react";
import styled from "styled-components";

const MapChartContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface MapChartComponentProps {
  isVisible: boolean;
}

class MapChartComponent extends React.Component<MapChartComponentProps> {
  render() {
    const { isVisible } = this.props;
    return <MapChartContainer>{isVisible}</MapChartContainer>;
  }
}

export default MapChartComponent;

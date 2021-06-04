import React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import styled from "styled-components";

const DividerWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Divider = styled.div`
  height: 100%;
  width: 0px;
  border-right: 2px solid grey;
`;

class DividerComponent extends React.Component<DividerComponentProps> {
  render() {
    return (
      <DividerWrapper>
        <Divider />
      </DividerWrapper>
    );
  }
}

export interface DividerComponentProps extends ComponentProps {
  orientation: "horizontal" | "vertical";
}

export default DividerComponent;

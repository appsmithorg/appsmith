import React from "react";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import styled from "styled-components";

const LineDiv = styled.div`
  border-top: 1px solid black;
  width: 100%;
`;

class LineSeparatorComponent extends React.Component<
  LineSeparatorComponentProps
> {
  render() {
    return (
      <CenteredWrapper>
        <LineDiv />
      </CenteredWrapper>
    );
  }
}

export interface LineSeparatorComponentProps extends ComponentProps {
  orientation: "horizontal" | "vertical";
}

export default LineSeparatorComponent;

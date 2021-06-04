import React from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import styled from "styled-components";

const DividerWrapper = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
`;
const HorizontalDivider = styled.div<DividerComponentProps>`
  height: 0px;
  width: 100%;
  border-top: ${(props) =>
    `${props.thickness || 1}px ${props.strokeStyle ||
      "solid"} ${props.dividerColor || "black"};`};
`;
const VerticalDivider = styled.div<DividerComponentProps>`
  width: 0px;
  height: 100%;
  border-right: ${(props) =>
    `${props.thickness || 1}px ${props.strokeStyle ||
      "solid"} ${props.dividerColor || "black"};`};
`;

class DividerComponent extends React.Component<DividerComponentProps> {
  render() {
    const { isHorizontal } = this.props;

    return (
      <DividerWrapper>
        {isHorizontal ? (
          <HorizontalDivider {...this.props} />
        ) : (
          <VerticalDivider {...this.props} />
        )}
      </DividerWrapper>
    );
  }
}

export interface DividerComponentProps extends ComponentProps {
  isHorizontal: boolean;
  strokeStyle?: "solid" | "dashed" | "dotted";
  dividerColor?: string;
  thickness?: number;
}

export default DividerComponent;

import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import styled from "styled-components";

export interface StyledImageProps {
  defaultImageUrl: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export const StyledImage = styled.div<StyledImageProps>`
  position: relative;
  display: flex;
  flex-direction: "row";
  background: ${props => props.backgroundColor};
  background-image: url("${props => {
    return props.imageUrl || props.defaultImageUrl;
  }}");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  height: 100%;
  width: 100%;
`;

class ImageComponent extends React.Component<ImageComponentProps> {
  render() {
    return (
      <StyledImage
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        {...this.props}
      ></StyledImage>
    );
  }
}

export interface ImageComponentProps extends ComponentProps {
  imageUrl: string;
  defaultImageUrl: string;
  isLoading: boolean;
}

export default ImageComponent;

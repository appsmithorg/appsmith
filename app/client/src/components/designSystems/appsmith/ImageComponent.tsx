import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { StyledContainer, StyledContainerProps } from "./StyledContainer";
import styled from "styled-components";

export interface StyledImageProps extends StyledContainerProps {
  defaultImageUrl: string;
}

export const StyledImage = styled(StyledContainer)<StyledImageProps>`
    background-image: url("${props => {
      return props.imageUrl || props.defaultImageUrl;
    }}");
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
`;

class ImageComponent extends React.Component<ImageComponentProps> {
  render() {
    return <StyledImage {...this.props}>{}</StyledImage>;
  }
}

export interface ImageComponentProps extends ComponentProps {
  imageUrl: string;
  defaultImageUrl: string;
}

export default ImageComponent;

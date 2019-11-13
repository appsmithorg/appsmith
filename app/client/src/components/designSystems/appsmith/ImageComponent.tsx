import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import { StyledContainer, StyledContainerProps } from "./StyledContainer";
import styled from "styled-components";

export const StyledImage = styled(StyledContainer)<StyledContainerProps>`
    background-image: url("${props => {
      return props.imageUrl;
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

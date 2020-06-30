import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import styled from "styled-components";

export interface StyledImageProps {
  defaultImageUrl: string;
  imageUrl?: string;
  backgroundColor?: string;
}

export const StyledImage = styled.div<
  StyledImageProps & {
    imageError: boolean;
  }
>`
  position: relative;
  display: flex;
  flex-direction: "row";
  background: ${props => props.backgroundColor};
  background-image: url("${props =>
    props.imageError ? props.defaultImageUrl : props.imageUrl}");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  height: 100%;
  width: 100%;
`;

class ImageComponent extends React.Component<
  ImageComponentProps,
  {
    imageError: boolean;
  }
> {
  constructor(props: ImageComponentProps) {
    super(props);
    this.state = {
      imageError: false,
    };
  }
  render() {
    return (
      <StyledImage
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        imageError={this.state.imageError}
        {...this.props}
      >
        <img
          style={{
            display: "none",
          }}
          alt={this.props.widgetName}
          src={this.props.imageUrl}
          onError={this.onImageError}
          onLoad={this.onImageLoad}
        ></img>
      </StyledImage>
    );
  }

  onImageError = () => {
    this.setState({
      imageError: true,
    });
  };

  onImageLoad = () => {
    this.setState({
      imageError: false,
    });
  };
}

export interface ImageComponentProps extends ComponentProps {
  imageUrl: string;
  defaultImageUrl: string;
  isLoading: boolean;
}

export default ImageComponent;

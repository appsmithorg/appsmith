import * as React from "react";
import { ComponentProps } from "./BaseComponent";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export interface StyledImageProps {
  defaultImageUrl: string;
  imageUrl?: string;
  backgroundColor?: string;
  showHoverPointer?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const StyledImage = styled.div<
  StyledImageProps & {
    imageError: boolean;
  }
>`
  position: relative;
  display: flex;
  flex-direction: "row";
  cursor: ${props =>
    props.showHoverPointer && props.onClick ? "pointer" : "inherit"};
  background: ${props => props.backgroundColor};
  background-image: url("${props =>
    props.imageError ? props.defaultImageUrl : props.imageUrl}");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
  height: 100%;
  width: 100%;
`;

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  .react-transform-element,
  .react-transform-component {
    height: 100%;
    width: 100%;
  }
`;
class ImageComponent extends React.Component<
  ImageComponentProps,
  {
    imageError: boolean;
    scale: number;
  }
> {
  constructor(props: ImageComponentProps) {
    super(props);
    this.state = {
      imageError: false,
      scale: 1,
    };
  }
  render() {
    const { maxZoomLevel } = this.props;
    const zoomActive = maxZoomLevel !== undefined && maxZoomLevel > 1;
    return (
      <Wrapper>
        <TransformWrapper
          defaultScale={1}
          onPanningStart={() => {
            this.props.disableDrag(true);
          }}
          options={{
            maxScale: maxZoomLevel,
            disabled: !zoomActive,
            transformEnabled: zoomActive,
          }}
          pan={{
            disabled: !zoomActive,
          }}
          wheel={{
            disabled: !zoomActive,
          }}
          onPanningStop={() => {
            this.props.disableDrag(false);
          }}
        >
          <TransformComponent>
            <StyledImage
              className={this.props.isLoading ? "bp3-skeleton" : ""}
              imageError={this.state.imageError}
              {...this.props}
              data-testid="styledImage"
            >
              <img
                style={{
                  display: "none",
                }}
                alt={this.props.widgetName}
                src={this.props.imageUrl}
                onError={this.onImageError}
                onLoad={this.onImageLoad}
                onClick={this.props.onClick}
              ></img>
            </StyledImage>
          </TransformComponent>
        </TransformWrapper>
      </Wrapper>
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
  showHoverPointer?: boolean;
  maxZoomLevel: number;
  disableDrag: (disabled: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default ImageComponent;

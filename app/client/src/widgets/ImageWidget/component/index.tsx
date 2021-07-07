import * as React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export interface StyledImageProps {
  defaultImageUrl: string;
  imageUrl?: string;
  backgroundColor?: string;
  showHoverPointer?: boolean;
  objectFit: string;
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
  background-size: ${(props) => props.objectFit ?? "cover"};
  cursor: ${(props) =>
    props.showHoverPointer && props.onClick ? "pointer" : "inherit"};
  background: ${(props) => props.backgroundColor};
  background-image: ${(props) =>
    `url(${props.imageError ? props.defaultImageUrl : props.imageUrl})`};
  background-position: center;
  background-repeat: no-repeat;
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

enum ZoomingState {
  MAX_ZOOMED_OUT = "MAX_ZOOMED_OUT",
  MAX_ZOOMED_IN = "MAX_ZOOMED_IN",
}
class ImageComponent extends React.Component<
  ImageComponentProps,
  {
    imageError: boolean;
    zoomingState: ZoomingState;
  }
> {
  isPanning: boolean;
  constructor(props: ImageComponentProps) {
    super(props);
    this.isPanning = false;
    this.state = {
      imageError: false,
      zoomingState: ZoomingState.MAX_ZOOMED_OUT,
    };
  }
  render() {
    const { maxZoomLevel } = this.props;
    const zoomActive =
      maxZoomLevel !== undefined && maxZoomLevel > 1 && !this.isPanning;
    const isZoomingIn = this.state.zoomingState === ZoomingState.MAX_ZOOMED_OUT;
    let cursor = "inherit";
    if (zoomActive) {
      cursor = isZoomingIn ? "zoom-in" : "zoom-out";
    }
    return (
      <Wrapper>
        <TransformWrapper
          defaultScale={1}
          doubleClick={{
            disabled: true,
          }}
          onPanning={() => {
            this.isPanning = true;
          }}
          onPanningStart={() => {
            this.props.disableDrag(true);
          }}
          onPanningStop={() => {
            this.props.disableDrag(false);
          }}
          onZoomChange={(zoom: any) => {
            if (zoomActive) {
              //Check max zoom
              if (
                maxZoomLevel === zoom.scale &&
                // Added for preventing infinite loops
                this.state.zoomingState !== ZoomingState.MAX_ZOOMED_IN
              ) {
                this.setState({
                  zoomingState: ZoomingState.MAX_ZOOMED_IN,
                });
                // Check min zoom
              } else if (
                zoom.scale === 1 &&
                this.state.zoomingState !== ZoomingState.MAX_ZOOMED_OUT
              ) {
                this.setState({
                  zoomingState: ZoomingState.MAX_ZOOMED_OUT,
                });
              }
            }
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
        >
          {({ zoomIn, zoomOut }: any) => (
            <TransformComponent>
              <StyledImage
                className={this.props.isLoading ? "bp3-skeleton" : ""}
                imageError={this.state.imageError}
                {...this.props}
                data-testid="styledImage"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  if (!this.isPanning) {
                    if (isZoomingIn) {
                      zoomIn(event);
                    } else {
                      zoomOut(event);
                    }
                    this.props.onClick && this.props.onClick(event);
                  }
                  this.isPanning = false;
                }}
                style={{
                  cursor,
                }}
              >
                {/* Used for running onImageError and onImageLoad Functions since Background Image doesn't have the functionality */}
                <img
                  alt={this.props.widgetName}
                  onError={this.onImageError}
                  onLoad={this.onImageLoad}
                  src={this.props.imageUrl}
                  style={{
                    display: "none",
                  }}
                />
              </StyledImage>
            </TransformComponent>
          )}
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
  objectFit: string;
  disableDrag: (disabled: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default ImageComponent;

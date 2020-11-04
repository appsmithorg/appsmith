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
          onPanningStart={() => {
            this.props.disableDrag(true);
          }}
          onPanning={() => {
            this.isPanning = true;
          }}
          onPanningStop={() => {
            this.props.disableDrag(false);
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
          doubleClick={{
            disabled: true,
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
        >
          {({ zoomIn, zoomOut }: any) => (
            <React.Fragment>
              <TransformComponent>
                <StyledImage
                  className={this.props.isLoading ? "bp3-skeleton" : ""}
                  imageError={this.state.imageError}
                  {...this.props}
                  data-testid="styledImage"
                  style={{
                    cursor,
                  }}
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
                >
                  <img
                    style={{
                      display: "none",
                    }}
                    alt={this.props.widgetName}
                    src={this.props.imageUrl}
                    onError={this.onImageError}
                    onLoad={this.onImageLoad}
                  />
                </StyledImage>
              </TransformComponent>
            </React.Fragment>
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
  disableDrag: (disabled: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default ImageComponent;

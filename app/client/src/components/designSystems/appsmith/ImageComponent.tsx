import * as React from "react";
import { Icon } from "@blueprintjs/core";
import { ComponentProps } from "./BaseComponent";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export interface StyledImageProps {
  defaultImageUrl: string;
  enableRotation?: boolean;
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
  cursor: ${(props) =>
    props.showHoverPointer && props.onClick ? "pointer" : "inherit"};
  background: ${(props) => props.backgroundColor};
  background-image: url("${(props) =>
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

const RotateBtnWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0px;
  right: 0px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
`;

const RotateBtn = styled.div`
  cursor: pointer;
  height: 30px;
  width: 30px;
  margin: 0px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: scale(1);

  &: hover {
    transform: scale(1.2);
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
    showRotateBtn: boolean;
    imageRotation: number;
    zoomingState: ZoomingState;
  }
> {
  isPanning: boolean;
  constructor(props: ImageComponentProps) {
    super(props);
    this.isPanning = false;
    this.state = {
      imageError: false,
      showRotateBtn: false,
      imageRotation: 0,
      zoomingState: ZoomingState.MAX_ZOOMED_OUT,
    };
  }
  render() {
    const { enableRotation, maxZoomLevel } = this.props;
    const { imageRotation, showRotateBtn } = this.state;
    const zoomActive =
      maxZoomLevel !== undefined && maxZoomLevel > 1 && !this.isPanning;
    const isZoomingIn = this.state.zoomingState === ZoomingState.MAX_ZOOMED_OUT;
    let cursor = "inherit";
    if (zoomActive) {
      cursor = isZoomingIn ? "zoom-in" : "zoom-out";
    }
    return (
      <Wrapper
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
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
            <>
              {showRotateBtn && enableRotation && (
                <RotateBtnWrapper>
                  <RotateBtn onClick={this.handleImageRotate(false)}>
                    <Icon
                      color="whitesmoke"
                      icon="image-rotate-left"
                      iconSize={24}
                    />
                  </RotateBtn>
                  <RotateBtn onClick={this.handleImageRotate(true)}>
                    <Icon
                      color="whitesmoke"
                      icon="image-rotate-right"
                      iconSize={24}
                    />
                  </RotateBtn>
                </RotateBtnWrapper>
              )}
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
                    transform: `rotate(${imageRotation}deg)`,
                  }}
                >
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
            </>
          )}
        </TransformWrapper>
      </Wrapper>
    );
  }

  handleImageRotate = (rotateRight: boolean) => (e: any) => {
    const { imageRotation } = this.state;

    const nextRotation = rotateRight ? imageRotation + 90 : imageRotation - 90;

    this.setState({ imageRotation: nextRotation % 360 });

    if (!!e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  onMouseEnter = () =>
    this.setState({ showRotateBtn: !!this.props.enableRotation && true });

  onMouseLeave = () => this.setState({ showRotateBtn: false });

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
  enableRotation?: boolean;
  disableDrag: (disabled: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default ImageComponent;

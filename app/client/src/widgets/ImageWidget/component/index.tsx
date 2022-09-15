import * as React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Colors } from "constants/Colors";
import { createMessage, IMAGE_LOAD_ERROR } from "@appsmith/constants/messages";

export interface StyledImageProps {
  defaultImageUrl: string;
  enableRotation?: boolean;
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
  background-size: ${(props) => props.objectFit ?? "contain"};
  cursor: ${(props) =>
    props.showHoverPointer && props.onClick ? "pointer" : "inherit"};
  background: ${(props) => props.backgroundColor};
  ${({ defaultImageUrl, imageError, imageUrl }) =>
    !imageError && `background-image: url("${imageUrl || defaultImageUrl}")`};
  background-position: center;
  background-repeat: no-repeat;
  height: 100%;
  width: 100%;
`;

const Wrapper = styled.div<{
  borderRadius: string;
  boxShadow?: string;
}>`
  height: 100%;
  width: 100%;
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  overflow: hidden;
  .react-transform-element,
  .react-transform-component {
    height: 100%;
    width: 100%;
  }
`;

const ControlBtnWrapper = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 2px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border: 1px solid ${Colors.GREY_5};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`};
`;

const ControlBtn = styled.a<{
  borderRadius?: string;
}>`
  height: 20px;
  width: 20px;
  color: white;
  padding: 0px 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s linear;
  margin: 0px 2px;
  border-radius: ${({ borderRadius }) => borderRadius};

  svg {
    height: 11px;
    width: 11px;
  }

  svg.is-download-icon {
    height: 13px;
    width: 15px;

    path {
      fill: ${Colors.GREY_7};
    }
  }

  &:hover {
    background: ${Colors.GREY_3};

    svg path {
      fill: ${Colors.GREY_9};
    }
  }
`;

const Separator = styled.div`
  height: 18px;
  width: 1px;
  background-color: ${Colors.GREY_5};
  margin: 0px 2px;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

enum ZoomingState {
  MAX_ZOOMED_OUT = "MAX_ZOOMED_OUT",
  MAX_ZOOMED_IN = "MAX_ZOOMED_IN",
}
class ImageComponent extends React.Component<
  ImageComponentProps,
  {
    imageError: boolean;
    showImageControl: boolean;
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
      showImageControl: false,
      imageRotation: 0,
      zoomingState: ZoomingState.MAX_ZOOMED_OUT,
    };
  }

  componentDidUpdate = (prevProps: ImageComponentProps) => {
    // reset the imageError flag when the defaultImageUrl or imageUrl changes
    if (
      (prevProps.imageUrl !== this.props.imageUrl ||
        prevProps.defaultImageUrl !== this.props.defaultImageUrl) &&
      this.state.imageError
    ) {
      this.setState({ imageError: false });
    }
  };

  render() {
    const { imageUrl, maxZoomLevel } = this.props;
    const { imageError, imageRotation } = this.state;
    const zoomActive =
      maxZoomLevel !== undefined && maxZoomLevel > 1 && !this.isPanning;
    const isZoomingIn = this.state.zoomingState === ZoomingState.MAX_ZOOMED_OUT;
    let cursor = "inherit";
    if (zoomActive) {
      cursor = isZoomingIn ? "zoom-in" : "zoom-out";
    }
    if (this.props.onClick) cursor = "pointer";

    if (imageUrl && imageError)
      return (
        <ErrorContainer data-testid="error-container">
          {createMessage(IMAGE_LOAD_ERROR)}
        </ErrorContainer>
      );

    return (
      <Wrapper
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
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
              {this.renderImageControl()}
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
                  // Checking if onClick event is associated, changing cursor to pointer.
                  style={{
                    cursor: cursor,
                    transform: `rotate(${imageRotation}deg)`,
                  }}
                >
                  {/* Used for running onImageError and onImageLoad Functions since Background Image doesn't have the functionality */}
                  <img
                    alt={this.props.widgetName}
                    onError={this.onImageError}
                    onLoad={this.onImageLoad}
                    src={this.props.imageUrl || this.props.defaultImageUrl}
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

  renderImageControl = () => {
    const {
      borderRadius,
      boxShadow,
      defaultImageUrl,
      enableDownload,
      enableRotation,
      imageUrl,
    } = this.props;
    const { showImageControl } = this.state;
    const showDownloadBtn = enableDownload && (!!imageUrl || !!defaultImageUrl);
    const hrefUrl = imageUrl || defaultImageUrl;

    if (showImageControl && (enableRotation || showDownloadBtn)) {
      return (
        <ControlBtnWrapper borderRadius={borderRadius} boxShadow={boxShadow}>
          {enableRotation && (
            <>
              <ControlBtn
                borderRadius={borderRadius}
                onClick={this.handleImageRotate(false)}
              >
                <svg
                  fill="none"
                  height="12"
                  viewBox="0 0 12 12"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.23333 2.17702C3.19999 1.21035 4.52666 0.610352 5.99999 0.610352C8.94666 0.610352 11.3267 2.99702 11.3267 5.94368C11.3267 8.89035 8.94666 11.277 5.99999 11.277C3.51333 11.277 1.43999 9.57702 0.846661 7.27702H2.23333C2.77999 8.83035 4.25999 9.94368 5.99999 9.94368C8.20666 9.94368 9.99999 8.15035 9.99999 5.94368C9.99999 3.73702 8.20666 1.94368 5.99999 1.94368C4.89333 1.94368 3.90666 2.40368 3.18666 3.13035L5.33333 5.27702H0.66666V0.610352L2.23333 2.17702Z"
                    fill="#858282"
                  />
                </svg>
              </ControlBtn>
              <ControlBtn
                borderRadius={borderRadius}
                onClick={this.handleImageRotate(true)}
              >
                <svg
                  fill="none"
                  height="12"
                  viewBox="0 0 12 12"
                  width="12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9.76667 2.17702C8.80001 1.21035 7.47334 0.610352 6.00001 0.610352C3.05334 0.610352 0.67334 2.99702 0.67334 5.94368C0.67334 8.89035 3.05334 11.277 6.00001 11.277C8.48667 11.277 10.56 9.57702 11.1533 7.27702H9.76667C9.22001 8.83035 7.74001 9.94368 6.00001 9.94368C3.79334 9.94368 2.00001 8.15035 2.00001 5.94368C2.00001 3.73702 3.79334 1.94368 6.00001 1.94368C7.10667 1.94368 8.09334 2.40368 8.81334 3.13035L6.66667 5.27702H11.3333V0.610352L9.76667 2.17702Z"
                    fill="#858282"
                  />
                </svg>
              </ControlBtn>
            </>
          )}

          {enableRotation && enableDownload && <Separator />}

          {showDownloadBtn && (
            <ControlBtn
              borderRadius={borderRadius}
              data-cy="t--image-download"
              download
              href={hrefUrl}
              target="_blank"
            >
              <svg
                className="is-download-icon"
                fill="none"
                height="13"
                viewBox="0 0 16 13"
                width="16"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.666749 8.6102C0.666338 7.87383 0.853696 7.14953 1.21112 6.50573C1.56854 5.86193 2.08421 5.3199 2.70942 4.93086C2.87442 3.64425 3.50261 2.46186 4.47643 1.60497C5.45024 0.748069 6.70294 0.275391 8.00008 0.275391C9.29723 0.275391 10.5499 0.748069 11.5237 1.60497C12.4976 2.46186 13.1257 3.64425 13.2907 4.93086C14.0662 5.41332 14.6695 6.12846 15.0143 6.97418C15.3591 7.8199 15.4279 8.75295 15.2108 9.64009C14.9938 10.5272 14.502 11.3231 13.8056 11.9141C13.1093 12.5051 12.244 12.8609 11.3334 12.9309L4.66675 12.9435C2.42942 12.7609 0.666749 10.8915 0.666749 8.6102ZM11.2321 11.6015C11.8626 11.553 12.4617 11.3065 12.9438 10.8972C13.4259 10.4879 13.7663 9.9367 13.9164 9.32236C14.0665 8.70801 14.0186 8.06195 13.7796 7.47645C13.5405 6.89095 13.1226 6.39596 12.5854 6.0622L12.0474 5.72686L11.9674 5.09886C11.8428 4.13465 11.3713 3.24882 10.6411 2.60692C9.91093 1.96502 8.97198 1.61099 7.99975 1.61099C7.02752 1.61099 6.08856 1.96502 5.35836 2.60692C4.62816 3.24882 4.1567 4.13465 4.03208 5.09886L3.95208 5.72686L3.41542 6.0622C2.87828 6.39593 2.46034 6.89085 2.22128 7.4763C1.98222 8.06174 1.93427 8.70775 2.08429 9.32207C2.2343 9.93639 2.5746 10.4876 3.05658 10.897C3.53857 11.3063 4.13758 11.5529 4.76808 11.6015L4.88341 11.6102H11.1167L11.2321 11.6015ZM8.66675 6.94353H10.6667L8.00008 10.2769L5.33342 6.94353H7.33342V4.27686H8.66675V6.94353Z"
                  fill="#858282"
                />
              </svg>
            </ControlBtn>
          )}
        </ControlBtnWrapper>
      );
    }
  };

  handleImageRotate = (rotateRight: boolean) => (e: any) => {
    const { imageRotation } = this.state;

    const nextRotation = rotateRight ? imageRotation + 90 : imageRotation - 90;

    this.setState({ imageRotation: nextRotation % 360 });

    if (!!e) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  onMouseEnter = () => {
    const { defaultImageUrl, imageUrl } = this.props;
    if (defaultImageUrl || imageUrl) {
      this.setState({ showImageControl: true });
    }
  };

  onMouseLeave = () => this.setState({ showImageControl: false });

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
  enableDownload?: boolean;
  objectFit: string;
  disableDrag: (disabled: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  borderRadius: string;
  boxShadow?: string;
}

export default ImageComponent;

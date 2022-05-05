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

const ControlBtnWrapper = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  padding: 5px 0px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
`;

const ControlBtn = styled.a`
  height: 25px;
  width: 45px;
  color: white;
  padding: 0px 10px;
  display: inline-block;

  &.separator {
    border-right: 1px solid ${Colors.ALTO2};
  }

  & > div {
    cursor: pointer;
    height: 100%;
    width: 100%;
    padding: 4px;
    transition: background 0.2s linear;

    & > svg {
      height: 16px;
      width: 17px;
    }
    &: hover {
      background: #ebebeb;
    }
  }
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
        <ControlBtnWrapper>
          {enableRotation && (
            <>
              <ControlBtn onClick={this.handleImageRotate(false)}>
                <div>
                  <svg
                    fill="none"
                    height="12"
                    viewBox="0 0 12 12"
                    width="12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.28492 1.81862C3.27446 0.939565 4.57489 0.400391 6.00002 0.400391C9.08724 0.400391 11.6 2.91317 11.6 6.00039C11.6 9.08761 9.08724 11.6004 6.00002 11.6004C2.91281 11.6004 0.400024 9.08761 0.400024 6.00039H1.33336C1.33336 8.58317 3.41724 10.6671 6.00002 10.6671C8.58281 10.6671 10.6667 8.58317 10.6667 6.00039C10.6667 3.41761 8.58281 1.33372 6.00002 1.33372C4.82777 1.33372 3.76447 1.7682 2.94573 2.47943L4.13336 3.66706H1.33336V0.867057L2.28492 1.81862Z"
                      fill="#858282"
                      stroke="#858282"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              </ControlBtn>
              <ControlBtn
                className="separator"
                onClick={this.handleImageRotate(true)}
              >
                <div>
                  <svg
                    fill="none"
                    height="12"
                    viewBox="0 0 12 12"
                    width="12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.400024 6.00039C0.400024 2.91317 2.91281 0.400391 6.00002 0.400391C7.42515 0.400391 8.72559 0.939565 9.71513 1.81862L10.6667 0.867057V3.66706H7.86669L9.05432 2.47943C8.23558 1.7682 7.17228 1.33372 6.00002 1.33372C3.41724 1.33372 1.33336 3.41761 1.33336 6.00039C1.33336 8.58317 3.41724 10.6671 6.00002 10.6671C8.58281 10.6671 10.6667 8.58317 10.6667 6.00039H11.6C11.6 9.08761 9.08724 11.6004 6.00002 11.6004C2.91281 11.6004 0.400024 9.08761 0.400024 6.00039Z"
                      fill="#858282"
                      stroke="#858282"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              </ControlBtn>
            </>
          )}
          {showDownloadBtn && (
            <ControlBtn
              data-cy="t--image-download"
              download
              href={hrefUrl}
              target="_blank"
            >
              <div>
                <svg fill="none" height="20" viewBox="0 0 20 20" width="20">
                  <path
                    clipRule="evenodd"
                    d="M15.4547 16.4284H13.117H6.88326H4.54559C2.8243 16.4284 1.42871 14.8933 1.42871 12.9999C1.42871 11.3987 2.43157 10.0641 3.7804 9.68786C3.93001 6.28329 6.47884 3.57129 9.61053 3.57129C12.7072 3.57129 15.2349 6.22243 15.4352 9.57386C17.183 9.56015 18.5716 11.1167 18.5716 12.9999C18.5716 14.8933 17.176 16.4284 15.4547 16.4284ZM12.7266 11.4286L9.99929 14.8572L7.27202 11.4286L8.83045 11.4286L8.83045 8.00004L11.1681 8.00003V11.4286L12.7266 11.4286Z"
                    fill="#939090"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
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

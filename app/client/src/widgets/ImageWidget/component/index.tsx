import * as React from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import styled from "styled-components";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { createMessage, IMAGE_LOAD_ERROR } from "ee/constants/messages";
import { importSvg } from "@appsmith/ads-old";

const RotateLeftIcon = importSvg(
  async () => import("assets/icons/widget/image/rotate-left.svg"),
);
const RotateRightIcon = importSvg(
  async () => import("assets/icons/widget/image/rotate-right.svg"),
);
const DownloadIcon = importSvg(
  async () => import("assets/icons/widget/image/download.svg"),
);

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
  border: 1px solid var(--wds-color-border);
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
      fill: var(--wds-color-icon);
    }
  }

  &:hover {
    background: var(--wds-color-bg-hover);

    svg path {
      fill: var(--wds-color-icon-hover);
    }
  }
`;

const Separator = styled.div`
  height: 18px;
  width: 1px;
  background-color: var(--wds-color-bg-strong);
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

    const hasOnClick = Boolean(zoomActive || this.props.onClick);

    const onClick = (
      event: React.MouseEvent<HTMLElement>,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zoomIn: any,
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zoomOut: any,
    ) => {
      if (!this.isPanning) {
        if (isZoomingIn) {
          zoomIn(event);
        } else {
          zoomOut(event);
        }

        this.props.onClick && this.props.onClick(event);
      }

      this.isPanning = false;
    };

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
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          {/* TODO: Fix this the next time the file is edited */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {({ zoomIn, zoomOut }: any) => (
            <>
              {this.renderImageControl()}
              <TransformComponent>
                <StyledImage
                  className={this.props.isLoading ? "bp3-skeleton" : ""}
                  imageError={this.state.imageError}
                  {...this.props}
                  data-testid="styledImage"
                  onClick={
                    hasOnClick ? (e) => onClick(e, zoomIn, zoomOut) : undefined
                  }
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
                <RotateLeftIcon />
              </ControlBtn>
              <ControlBtn
                borderRadius={borderRadius}
                onClick={this.handleImageRotate(true)}
              >
                <RotateRightIcon />
              </ControlBtn>
            </>
          )}

          {enableRotation && enableDownload && <Separator />}

          {showDownloadBtn && (
            <ControlBtn
              borderRadius={borderRadius}
              data-testid="t--image-download"
              download
              href={hrefUrl}
              target="_blank"
            >
              <DownloadIcon />
            </ControlBtn>
          )}
        </ControlBtnWrapper>
      );
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

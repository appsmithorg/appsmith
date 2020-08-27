import React from "react";
import { ReactComponent as BagIcon } from "assets/icons/ads/bag.svg";
import { ReactComponent as ProductIcon } from "assets/icons/ads/product.svg";
import { ReactComponent as BookIcon } from "assets/icons/ads/book.svg";
import { ReactComponent as CameraIcon } from "assets/icons/ads/camera.svg";
import { ReactComponent as FileIcon } from "assets/icons/ads/file.svg";
import { ReactComponent as ChatIcon } from "assets/icons/ads/chat.svg";
import { ReactComponent as CalenderIcon } from "assets/icons/ads/calender.svg";
import { ReactComponent as FrameIcon } from "assets/icons/ads/frame.svg";
import { ReactComponent as GlobeIcon } from "assets/icons/ads/globe.svg";
import { ReactComponent as ShopperIcon } from "assets/icons/ads/shopper.svg";
import { ReactComponent as HeartIcon } from "assets/icons/ads/heart.svg";
import { ReactComponent as FlightIcon } from "assets/icons/ads/flight.svg";

import styled from "styled-components";
import { Size } from "./Button";

export enum AppIconName {
  BAG = "bag",
  PRODUCT = "product",
  BOOK = "book",
  CAMERA = "camera",
  FILE = "file",
  CHAT = "chat",
  CALENDER = "calender",
  FLIGHT = "flight",
  FRAME = "frame",
  GLOBE = "globe",
  SHOPPER = "shopper",
  HEART = "heart",
}

export const sizeHandler = (size: Size) => {
  let iconSize = 0;
  switch (size) {
    case Size.small:
      iconSize = 20;
      break;
    case Size.medium:
      iconSize = 30;
      break;
    case Size.large:
      iconSize = 54;
      break;
  }
  return iconSize;
};

const IconWrapper = styled.div<AppIconProps>`
  cursor: pointer;
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: ${props => sizeHandler(props.size)}px;
    height: ${props => sizeHandler(props.size)}px;
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
`;

export type AppIconProps = {
  size: Size;
  name: AppIconName;
};

const AppIcon = (props: AppIconProps) => {
  let returnIcon;
  switch (props.name) {
    case AppIconName.BAG:
      returnIcon = <BagIcon />;
      break;
    case AppIconName.PRODUCT:
      returnIcon = <ProductIcon />;
      break;
    case AppIconName.BOOK:
      returnIcon = <BookIcon />;
      break;
    case AppIconName.CAMERA:
      returnIcon = <CameraIcon />;
      break;
    case AppIconName.FILE:
      returnIcon = <FileIcon />;
      break;
    case AppIconName.CHAT:
      returnIcon = <ChatIcon />;
      break;
    case AppIconName.CALENDER:
      returnIcon = <CalenderIcon />;
      break;
    case AppIconName.FRAME:
      returnIcon = <FrameIcon />;
      break;
    case AppIconName.GLOBE:
      returnIcon = <GlobeIcon />;
      break;
    case AppIconName.SHOPPER:
      returnIcon = <ShopperIcon />;
      break;
    case AppIconName.HEART:
      returnIcon = <HeartIcon />;
      break;
    case AppIconName.FLIGHT:
      returnIcon = <FlightIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? <IconWrapper {...props}>{returnIcon}</IconWrapper> : null;
};

export default AppIcon;

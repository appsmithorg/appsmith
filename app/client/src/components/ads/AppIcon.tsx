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
import { sizeHandler } from "./Spinner";

export type AppIconName =
  | "bag"
  | "product"
  | "book"
  | "camera"
  | "file"
  | "chat"
  | "calender"
  | "flight"
  | "frame"
  | "globe"
  | "shopper"
  | "heart";

const IconWrapper = styled.div<AppIconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: 22px;
    height: 20px;
    path {
      fill: ${props => props.theme.colors.blackShades[4]};
    }
  }

  &:hover {
    cursor: pointer;
    path {
      fill: ${props => props.theme.colors.blackShades[6]};
    }
  }

  &:active {
    cursor: pointer;
    path {
      fill: ${props => props.theme.colors.blackShades[7]};
    }
  }
`;

export type AppIconProps = {
  size?: Size;
  name?: AppIconName;
  className?: string;
};

const AppIcon = (props: AppIconProps) => {
  let returnIcon;
  switch (props.name) {
    case "bag":
      returnIcon = <BagIcon />;
      break;
    case "product":
      returnIcon = <ProductIcon />;
      break;
    case "book":
      returnIcon = <BookIcon />;
      break;
    case "camera":
      returnIcon = <CameraIcon />;
      break;
    case "file":
      returnIcon = <FileIcon />;
      break;
    case "chat":
      returnIcon = <ChatIcon />;
      break;
    case "calender":
      returnIcon = <CalenderIcon />;
      break;
    case "frame":
      returnIcon = <FrameIcon />;
      break;
    case "globe":
      returnIcon = <GlobeIcon />;
      break;
    case "shopper":
      returnIcon = <ShopperIcon />;
      break;
    case "heart":
      returnIcon = <HeartIcon />;
      break;
    case "flight":
      returnIcon = <FlightIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? (
    <IconWrapper
      className={props.className ? props.className : "ads-icon"}
      {...props}
    >
      {returnIcon}
    </IconWrapper>
  ) : null;
};

export default AppIcon;

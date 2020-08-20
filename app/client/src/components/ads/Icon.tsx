import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
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

export type IconName =
  | "Select icon"
  | "delete"
  | "user"
  | "general"
  | "billing"
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
  | "heart"
  | undefined;

const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: ${props => sizeHandler(props)}px;
    height: ${props => sizeHandler(props)}px;
    path {
      fill: ${props => props.theme.colors.blackShades[4]};
    }
  }
  visibility: ${props => (props.invisible ? "hidden" : "visible")};

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

export type IconProps = {
  size?: Size;
  name?: IconName;
  invisible?: boolean;
};

export const Icon = (props: IconProps) => {
  let returnIcon;
  switch (props.name) {
    case "delete":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <DeleteIcon />
        </IconWrapper>
      );
      break;
    case "user":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <UserIcon />
        </IconWrapper>
      );
      break;
    case "general":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <GeneralIcon />
        </IconWrapper>
      );
      break;
    case "billing":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <BillingIcon />
        </IconWrapper>
      );
      break;
    case "bag":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <BagIcon />
        </IconWrapper>
      );
      break;
    case "product":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <ProductIcon />
        </IconWrapper>
      );
      break;
    case "book":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <BookIcon />
        </IconWrapper>
      );
      break;
    case "camera":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <CameraIcon />
        </IconWrapper>
      );
      break;
    case "file":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <FileIcon />
        </IconWrapper>
      );
      break;
    case "chat":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <ChatIcon />
        </IconWrapper>
      );
      break;
    case "calender":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <CalenderIcon />
        </IconWrapper>
      );
      break;
    case "frame":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <FrameIcon />
        </IconWrapper>
      );
      break;
    case "globe":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <GlobeIcon />
        </IconWrapper>
      );
      break;
    case "shopper":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <ShopperIcon />
        </IconWrapper>
      );
      break;
    case "heart":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <HeartIcon />
        </IconWrapper>
      );
      break;
    case "flight":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <FlightIcon />
        </IconWrapper>
      );
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon;
};

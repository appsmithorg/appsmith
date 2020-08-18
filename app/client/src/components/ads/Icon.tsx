import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import { ReactComponent as EditIcon } from "assets/icons/ads/edit.svg";
import { ReactComponent as ErrorIcon } from "assets/icons/ads/error.svg";
import { ReactComponent as SuccessIcon } from "assets/icons/ads/success.svg";
import styled from "styled-components";
import { Size } from "./Button";
import { sizeHandler } from "./Spinner";

export type IconName =
  | "Select icon"
  | "delete"
  | "user"
  | "general"
  | "billing"
  | "edit"
  | "error"
  | "success"
  | undefined;

const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: ${props =>
      props.size ? sizeHandler(props) : props.theme.spaces[9]}px;
    height: ${props =>
      props.size ? sizeHandler(props) : props.theme.spaces[9]}px;
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
    case "edit":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <EditIcon />
        </IconWrapper>
      );
      break;
    case "error":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <ErrorIcon />
        </IconWrapper>
      );
      break;
    case "success":
      returnIcon = (
        <IconWrapper className="ads-icon" {...props}>
          <SuccessIcon />
        </IconWrapper>
      );
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon;
};

import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import styled from "styled-components";
import { Size } from "./Button";
import { sizeHandler } from "./Spinner";

export type IconName =
  | "Select icon"
  | "delete"
  | "user"
  | "general"
  | "billing"
  | undefined;

const IconWrapper = styled.div<IconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: ${props => sizeHandler(props)}px;
    height: ${props => sizeHandler(props)}px;
  }
  visibility: ${props => (props.invisible ? "hidden" : "visible")};
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
    default:
      returnIcon = null;
      break;
  }
  return returnIcon;
};

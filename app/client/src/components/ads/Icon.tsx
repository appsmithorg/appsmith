import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CloseIcon } from "assets/icons/ads/close.svg";
import styled from "styled-components";
import { Size } from "./Button";
import { sizeHandler } from "./Spinner";

export type IconName =
  | "Select icon"
  | "delete"
  | "user"
  | "general"
  | "billing"
  | "search"
  | "close"
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
  className?: string;
  click?: () => void;
};

const Icon = (props: IconProps) => {
  let returnIcon;
  switch (props.name) {
    case "delete":
      returnIcon = <DeleteIcon />;
      break;
    case "user":
      returnIcon = <UserIcon />;
      break;
    case "general":
      returnIcon = <GeneralIcon />;
      break;
    case "billing":
      returnIcon = <BillingIcon />;
      break;
    case "search":
      returnIcon = <SearchIcon />;
      break;
    case "close":
      returnIcon = <CloseIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? (
    <IconWrapper
      className={props.className ? props.className : "ads-icon"}
      {...props}
      onClick={() => props.click && props.click()}
    >
      {returnIcon}
    </IconWrapper>
  ) : null;
};

export default Icon;

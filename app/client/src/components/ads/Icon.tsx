import React from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import { ReactComponent as EditIcon } from "assets/icons/ads/edit.svg";
import { ReactComponent as ErrorIcon } from "assets/icons/ads/error.svg";
import { ReactComponent as SuccessIcon } from "assets/icons/ads/success.svg";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CloseIcon } from "assets/icons/ads/close.svg";
import { ReactComponent as DownArrow } from "assets/icons/ads/down_arrow.svg";
import { ReactComponent as ShareIcon } from "assets/icons/ads/share.svg";
import { ReactComponent as RocketIcon } from "assets/icons/ads/launch.svg";
import { ReactComponent as WorkspaceIcon } from "assets/icons/ads/workspace.svg";
import { ReactComponent as CreateNewIcon } from "assets/icons/ads/create-new.svg";
import { ReactComponent as InviteUserIcon } from "assets/icons/ads/invite-users.svg";
import { ReactComponent as ViewAllIcon } from "assets/icons/ads/view-all.svg";
import { ReactComponent as ContextMenuIcon } from "assets/icons/ads/context-menu.svg";
import { ReactComponent as DuplicateIcon } from "assets/icons/ads/duplicate.svg";
import { ReactComponent as LogoutIcon } from "assets/icons/ads/logout.svg";
import styled from "styled-components";
import { CommonComponentProps, Classes } from "./common";
import { noop } from "lodash";
import { theme } from "constants/DefaultTheme";

export enum IconSize {
  XXS = "extraExtraSmall",
  XS = "extraSmall",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  XL = "extraLarge",
  XXL = "extraExtraLarge",
  XXXL = "extraExtraExtraLarge",
}

export const sizeHandler = (size?: IconSize) => {
  let iconSize = 0;
  switch (size) {
    case IconSize.XXS:
      iconSize = theme.iconSizes.XXS;
      break;
    case IconSize.XS:
      iconSize = theme.iconSizes.XS;
      break;
    case IconSize.SMALL:
      iconSize = theme.iconSizes.SMALL;
      break;
    case IconSize.MEDIUM:
      iconSize = theme.iconSizes.MEDIUM;
      break;
    case IconSize.LARGE:
      iconSize = theme.iconSizes.LARGE;
      break;
    case IconSize.XL:
      iconSize = theme.iconSizes.XL;
      break;
    case IconSize.XXL:
      iconSize = theme.iconSizes.XXL;
      break;
    case IconSize.XXXL:
      iconSize = theme.iconSizes.XXXL;
      break;
    default:
      iconSize = theme.iconSizes.SMALL;
      break;
  }
  return iconSize;
};

export const IconCollection = [
  "delete",
  "user",
  "general",
  "billing",
  "edit",
  "error",
  "success",
  "search",
  "close",
  "share",
  "rocket",
  "workspace",
  "plus",
  "invite-user",
  "view-all",
  "downArrow",
  "context-menu",
  "duplicate",
  "logout",
] as const;

export type IconName = typeof IconCollection[number];

const IconWrapper = styled.span<IconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  svg {
    width: ${props => sizeHandler(props.size)}px;
    height: ${props => sizeHandler(props.size)}px;
    path {
      fill: ${props => props.theme.colors.blackShades[6]};
    }
  }
  visibility: ${props => (props.invisible ? "hidden" : "visible")};

  &:hover {
    cursor: pointer;
    path {
      fill: ${props => props.theme.colors.blackShades[8]};
    }
  }

  &:active {
    cursor: pointer;
    path {
      fill: ${props => props.theme.colors.blackShades[9]};
    }
  }
`;

export type IconProps = {
  size?: IconSize;
  name?: IconName;
  invisible?: boolean;
  className?: string;
  onClick?: () => void;
};

const Icon = (props: IconProps & CommonComponentProps) => {
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
    case "edit":
      returnIcon = <EditIcon />;
      break;
    case "error":
      returnIcon = <ErrorIcon />;
      break;
    case "success":
      returnIcon = <SuccessIcon />;
      break;
    case "search":
      returnIcon = <SearchIcon />;
      break;
    case "close":
      returnIcon = <CloseIcon />;
      break;
    case "downArrow":
      returnIcon = <DownArrow />;
      break;
    case "share":
      returnIcon = <ShareIcon />;
      break;
    case "rocket":
      returnIcon = <RocketIcon />;
      break;
    case "workspace":
      returnIcon = <WorkspaceIcon />;
      break;
    case "plus":
      returnIcon = <CreateNewIcon />;
      break;
    case "invite-user":
      returnIcon = <InviteUserIcon />;
      break;
    case "view-all":
      returnIcon = <ViewAllIcon />;
      break;
    case "context-menu":
      returnIcon = <ContextMenuIcon />;
      break;
    case "duplicate":
      returnIcon = <DuplicateIcon />;
      break;
    case "logout":
      returnIcon = <LogoutIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? (
    <IconWrapper
      className={Classes.ICON}
      data-cy={props.cypressSelector}
      {...props}
      onClick={props.onClick || noop}
    >
      {returnIcon}
    </IconWrapper>
  ) : null;
};

export default Icon;

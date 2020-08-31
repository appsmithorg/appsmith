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
import { ReactComponent as ShareIcon } from "assets/icons/ads/share.svg";
import { ReactComponent as LaunchIcon } from "assets/icons/ads/launch.svg";
import { ReactComponent as WorkspaceIcon } from "assets/icons/ads/workspace.svg";
import { ReactComponent as CreateNewIcon } from "assets/icons/ads/create-new.svg";
import { ReactComponent as InviteUserIcon } from "assets/icons/ads/invite-users.svg";
import { ReactComponent as ViewAllIcon } from "assets/icons/ads/view-all.svg";
import styled from "styled-components";
import { CommonComponentProps } from "./common";
import { noop } from "lodash";
import { theme } from "constants/DefaultTheme";

export enum IconSize {
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

export enum IconName {
  NO_ICON = "no icon",
  DELETE = "delete",
  USER = "user",
  GENERAL = "general",
  BILLING = "billing",
  EDIT = "edit",
  ERROR = "error",
  SUCCESS = "success",
  SEARCH = "search",
  CLOSE = "close",
  SHARE = "share",
  LAUNCH = "launch",
  WORKSPACE = "workspace",
  CREATE_NEW = "create new",
  INVITE_USER = "invite user",
  VIEW_ALL = "view all",
}

const IconWrapper = styled.div<IconProps>`
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
    case IconName.DELETE:
      returnIcon = <DeleteIcon />;
      break;
    case IconName.USER:
      returnIcon = <UserIcon />;
      break;
    case IconName.GENERAL:
      returnIcon = <GeneralIcon />;
      break;
    case IconName.BILLING:
      returnIcon = <BillingIcon />;
      break;
    case IconName.EDIT:
      returnIcon = <EditIcon />;
      break;
    case IconName.ERROR:
      returnIcon = <ErrorIcon />;
      break;
    case IconName.SUCCESS:
      returnIcon = <SuccessIcon />;
      break;
    case IconName.SEARCH:
      returnIcon = <SearchIcon />;
      break;
    case IconName.CLOSE:
      returnIcon = <CloseIcon />;
      break;
    case IconName.SHARE:
      returnIcon = <ShareIcon />;
      break;
    case IconName.LAUNCH:
      returnIcon = <LaunchIcon />;
      break;
    case IconName.WORKSPACE:
      returnIcon = <WorkspaceIcon />;
      break;
    case IconName.CREATE_NEW:
      returnIcon = <CreateNewIcon />;
      break;
    case IconName.INVITE_USER:
      returnIcon = <InviteUserIcon />;
      break;
    case IconName.VIEW_ALL:
      returnIcon = <ViewAllIcon />;
      break;
    default:
      returnIcon = null;
      break;
  }
  return returnIcon ? (
    <IconWrapper
      className={props.className ? props.className : "ads-icon"}
      data-cy={props.cypressSelector}
      {...props}
      onClick={props.onClick || noop}
    >
      {returnIcon}
    </IconWrapper>
  ) : null;
};

export default Icon;

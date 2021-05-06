import React, { forwardRef, Ref } from "react";
import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as BookIcon } from "assets/icons/ads/book.svg";
import { ReactComponent as BugIcon } from "assets/icons/ads/bug.svg";
import { ReactComponent as CancelIcon } from "assets/icons/ads/cancel.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import { ReactComponent as OpenIcon } from "assets/icons/ads/open.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import { ReactComponent as EditIcon } from "assets/icons/ads/edit.svg";
import { ReactComponent as ErrorIcon } from "assets/icons/ads/error.svg";
import { ReactComponent as ShineIcon } from "assets/icons/ads/shine.svg";
import { ReactComponent as SuccessIcon } from "assets/icons/ads/success.svg";
import { ReactComponent as SearchIcon } from "assets/icons/ads/search.svg";
import { ReactComponent as CloseIcon } from "assets/icons/ads/close.svg";
import { ReactComponent as WarningIcon } from "assets/icons/ads/warning.svg";
import { ReactComponent as WarningTriangleIcon } from "assets/icons/ads/warning-triangle.svg";
import { ReactComponent as DownArrow } from "assets/icons/ads/down_arrow.svg";
import { ReactComponent as ShareIcon } from "assets/icons/ads/share.svg";
import { ReactComponent as RocketIcon } from "assets/icons/ads/launch.svg";
import { ReactComponent as WorkspaceIcon } from "assets/icons/ads/workspace.svg";
import { ReactComponent as CreateNewIcon } from "assets/icons/ads/create-new.svg";
import { ReactComponent as InviteUserIcon } from "assets/icons/ads/invite-users.svg";
import { ReactComponent as ViewAllIcon } from "assets/icons/ads/view-all.svg";
import { ReactComponent as ViewLessIcon } from "assets/icons/ads/view-less.svg";
import { ReactComponent as ContextMenuIcon } from "assets/icons/ads/context-menu.svg";
import { ReactComponent as DuplicateIcon } from "assets/icons/ads/duplicate.svg";
import { ReactComponent as LogoutIcon } from "assets/icons/ads/logout.svg";
import { ReactComponent as ManageIcon } from "assets/icons/ads/manage.svg";
import { ReactComponent as ArrowLeft } from "assets/icons/ads/arrow-left.svg";
import { ReactComponent as Fork } from "assets/icons/ads/fork.svg";
import { ReactComponent as ChevronLeft } from "assets/icons/ads/chevron_left.svg";
import { ReactComponent as ChevronRight } from "assets/icons/ads/chevron_right.svg";
import { ReactComponent as LinkIcon } from "assets/icons/ads/link.svg";
import { ReactComponent as HelpIcon } from "assets/icons/help/help.svg";
import { ReactComponent as CloseModalIcon } from "assets/icons/ads/close-modal.svg";
import { ReactComponent as NoResponseIcon } from "assets/icons/ads/no-response.svg";
import { ReactComponent as LightningIcon } from "assets/icons/ads/lightning.svg";
import { ReactComponent as AddMoreIcon } from "assets/icons/ads/add-more.svg";
import { ReactComponent as RightArrowIcon } from "assets/icons/ads/right-arrow.svg";
import { ReactComponent as DatasourceIcon } from "assets/icons/ads/datasource.svg";
import { ReactComponent as PlayIcon } from "assets/icons/ads/play.svg";
import { ReactComponent as DesktopIcon } from "assets/icons/ads/desktop.svg";
import { ReactComponent as WandIcon } from "assets/icons/ads/wand.svg";
import { ReactComponent as MobileIcon } from "assets/icons/ads/mobile.svg";
import { ReactComponent as TabletIcon } from "assets/icons/ads/tablet.svg";
import { ReactComponent as FluidIcon } from "assets/icons/ads/fluid.svg";
import { ReactComponent as CardContextMenu } from "assets/icons/ads/card-context-menu.svg";
import { ReactComponent as SendButton } from "assets/icons/comments/send-button.svg";
import { ReactComponent as Emoji } from "assets/icons/comments/emoji.svg";
import { ReactComponent as Pin } from "assets/icons/comments/pin.svg";
import { ReactComponent as OvalCheck } from "assets/icons/comments/check-oval.svg";
import { ReactComponent as ContextMenu } from "assets/icons/ads/context-menu.svg";
import { ReactComponent as Trash } from "assets/icons/comments/trash.svg";
import { ReactComponent as Pin2 } from "assets/icons/comments/pin_2.svg";
import { ReactComponent as Link2 } from "assets/icons/comments/link.svg";
import styled from "styled-components";
import { CommonComponentProps, Classes } from "./common";
import { noop } from "lodash";
import { theme } from "constants/DefaultTheme";
import Spinner from "./Spinner";
import { ControlIcons } from "icons/ControlIcons";

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
  "book",
  "bug",
  "cancel",
  "cross",
  "delete",
  "open",
  "user",
  "general",
  "billing",
  "edit",
  "error",
  "shine",
  "danger",
  "success",
  "search",
  "close",
  "share",
  "rocket",
  "workspace",
  "plus",
  "invite-user",
  "view-all",
  "view-less",
  "warning",
  "warning-triangle",
  "downArrow",
  "context-menu",
  "duplicate",
  "logout",
  "manage",
  "arrow-left",
  "fork",
  "chevron-left",
  "chevron-right",
  "link",
  "help",
  "close-modal",
  "no-response",
  "lightning",
  "add-more",
  "right-arrow",
  "datasource",
  "play",
  "desktop",
  "wand",
  "mobile",
  "tablet",
  "fluid",
  "card-context-menu",
  "send-button",
  "emoji",
  "pin",
  "oval-check",
  "HEADING_ONE",
  "HEADING_TWO",
  "HEADING_THREE",
  "PARAGRAPH",
  "PARAGRAPH_TWO",
  "context-menu",
  "trash",
  "pin-2",
  "link-2",
  "close-x",
] as const;

export type IconName = typeof IconCollection[number];

export const IconWrapper = styled.span<IconProps>`
  &:focus {
    outline: none;
  }
  display: flex;
  align-items: center;
  svg {
    width: ${(props) => sizeHandler(props.size)}px;
    height: ${(props) => sizeHandler(props.size)}px;
    ${(props) =>
      !props.keepColors
        ? `
    path {
      fill: ${props.fillColor || props.theme.colors.icon.normal};
    }
    circle {
      fill: ${props.fillColor || props.theme.colors.icon.normal};
    }
    `
        : ""}
  ${(props) => (props.invisible ? `visibility: hidden;` : null)};

  &:hover {
    cursor: pointer;
    ${(props) =>
      !props.keepColors
        ? `
    path {
      fill: ${props.theme.colors.icon.hover};
    }
    `
        : ""}
  }

  &:active {
    cursor: pointer;
    path {
      fill: ${(props) => props.theme.colors.icon.active};
    }
  }
`;

export type IconProps = {
  size?: IconSize;
  name?: IconName;
  invisible?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  fillColor?: string;
  keepColors?: boolean;
};

const Icon = forwardRef(
  (props: IconProps & CommonComponentProps, ref: Ref<HTMLSpanElement>) => {
    let returnIcon;
    switch (props.name) {
      case "book":
        returnIcon = <BookIcon />;
        break;
      case "bug":
        returnIcon = <BugIcon />;
        break;
      case "cancel":
        returnIcon = <CancelIcon />;
        break;
      case "cross":
        returnIcon = <CrossIcon />;
        break;
      case "delete":
        returnIcon = <DeleteIcon />;
        break;
      case "open":
        returnIcon = <OpenIcon />;
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
      case "danger":
        returnIcon = <ErrorIcon />;
        break;
      case "shine":
        returnIcon = <ShineIcon />;
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
      case "wand":
        returnIcon = <WandIcon />;
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
      case "view-less":
        returnIcon = <ViewLessIcon />;
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
      case "manage":
        returnIcon = <ManageIcon />;
        break;
      case "warning":
        returnIcon = <WarningIcon />;
        break;
      case "warning-triangle":
        returnIcon = <WarningTriangleIcon />;
        break;
      case "arrow-left":
        returnIcon = <ArrowLeft />;
        break;
      case "fork":
        returnIcon = <Fork />;
        break;
      case "chevron-left":
        returnIcon = <ChevronLeft />;
        break;
      case "chevron-right":
        returnIcon = <ChevronRight />;
        break;
      case "link":
        returnIcon = <LinkIcon />;
        break;
      case "help":
        returnIcon = <HelpIcon />;
        break;
      case "close-modal":
      case "close-x":
        returnIcon = <CloseModalIcon />;
        break;
      case "no-response":
        returnIcon = <NoResponseIcon />;
        break;
      case "lightning":
        returnIcon = <LightningIcon />;
        break;
      case "add-more":
        returnIcon = <AddMoreIcon />;
        break;
      case "right-arrow":
        returnIcon = <RightArrowIcon />;
        break;
      case "datasource":
        returnIcon = <DatasourceIcon />;
        break;
      case "play":
        returnIcon = <PlayIcon />;
        break;
      case "desktop":
        returnIcon = <DesktopIcon />;
        break;
      case "mobile":
        returnIcon = <MobileIcon />;
        break;
      case "tablet":
        returnIcon = <TabletIcon />;
        break;
      case "fluid":
        returnIcon = <FluidIcon />;
        break;
      case "card-context-menu":
        returnIcon = <CardContextMenu />;
        break;
      case "send-button":
        returnIcon = <SendButton />;
        break;
      case "emoji":
        returnIcon = <Emoji />;
        break;
      case "pin":
        returnIcon = <Pin />;
        break;
      case "oval-check":
        returnIcon = <OvalCheck />;
        break;

      case "HEADING_ONE":
      case "HEADING_TWO":
      case "HEADING_THREE":
      case "PARAGRAPH":
      case "PARAGRAPH_TWO":
        const ControlIcon = ControlIcons[props.name];
        returnIcon = <ControlIcon height={24} width={24} />;
        break;

      case "context-menu":
        returnIcon = <ContextMenu />;
        break;

      case "pin-2":
        returnIcon = <Pin2 />;
        break;

      case "link-2":
        returnIcon = <Link2 />;
        break;

      case "trash":
        returnIcon = <Trash />;
        break;

      default:
        returnIcon = null;
        break;
    }
    return returnIcon && !props.isLoading ? (
      <IconWrapper
        className={Classes.ICON}
        data-cy={props.cypressSelector}
        ref={ref}
        {...props}
        onClick={props.onClick || noop}
      >
        {returnIcon}
      </IconWrapper>
    ) : props.isLoading ? (
      <Spinner size={props.size} />
    ) : null;
  },
);

Icon.displayName = "Icon";

export default Icon;

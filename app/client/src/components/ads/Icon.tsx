import React, { forwardRef, Ref } from "react";
// import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as BookLineIcon } from "assets/icons/ads/book-open-line.svg";
import { ReactComponent as BugIcon } from "assets/icons/ads/bug.svg";
import { ReactComponent as CancelIcon } from "assets/icons/ads/cancel.svg";
// import { ReactComponent as ExpandMore } from "assets/icons/ads/expand-more.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import { ReactComponent as OpenIcon } from "assets/icons/ads/open.svg";
import { ReactComponent as UserIcon } from "assets/icons/ads/user.svg";
import { ReactComponent as GeneralIcon } from "assets/icons/ads/general.svg";
import { ReactComponent as BillingIcon } from "assets/icons/ads/billing.svg";
import { ReactComponent as ErrorIcon } from "assets/icons/ads/error.svg";
import { ReactComponent as ShineIcon } from "assets/icons/ads/shine.svg";
import { ReactComponent as SuccessIcon } from "assets/icons/ads/success.svg";
import SearchIcon from "remixicon-react/SearchLineIcon";
import { ReactComponent as CloseIcon } from "assets/icons/ads/close.svg";
// import { ReactComponent as WarningIcon } from "assets/icons/ads/warning.svg";
import { ReactComponent as WarningTriangleIcon } from "assets/icons/ads/warning-triangle.svg";
import { ReactComponent as ShareIcon2 } from "assets/icons/ads/share-2.svg";
import { ReactComponent as InviteUserIcon } from "assets/icons/ads/invite-users.svg";
// import { ReactComponent as ViewAllIcon } from "assets/icons/ads/view-all.svg";
// import { ReactComponent as ViewLessIcon } from "assets/icons/ads/view-less.svg";
// import { ReactComponent as DuplicateIcon } from "assets/icons/ads/duplicate.svg";
// import { ReactComponent as LogoutIcon } from "assets/icons/ads/logout.svg";
import { ReactComponent as ManageIcon } from "assets/icons/ads/manage.svg";
import { ReactComponent as ArrowLeft } from "assets/icons/ads/arrow-left.svg";
// import { ReactComponent as Fork } from "assets/icons/ads/fork.svg";
import { ReactComponent as ChevronLeft } from "assets/icons/ads/chevron_left.svg";
import { ReactComponent as LinkIcon } from "assets/icons/ads/link.svg";
// import { ReactComponent as CloseModalIcon } from "assets/icons/ads/close-modal.svg";
import { ReactComponent as NoResponseIcon } from "assets/icons/ads/no-response.svg";
import { ReactComponent as LightningIcon } from "assets/icons/ads/lightning.svg";
// import { ReactComponent as AddMoreIcon } from "assets/icons/ads/add-more.svg";
// import { ReactComponent as RightArrowIcon } from "assets/icons/ads/right-arrow.svg";
import { ReactComponent as TrendingFlat } from "assets/icons/ads/trending-flat.svg";
// import { ReactComponent as DatasourceIcon } from "assets/icons/ads/datasource.svg";
import { ReactComponent as PlayIcon } from "assets/icons/ads/play.svg";
import { ReactComponent as DesktopIcon } from "assets/icons/ads/desktop.svg";
import { ReactComponent as WandIcon } from "assets/icons/ads/wand.svg";
import { ReactComponent as MobileIcon } from "assets/icons/ads/mobile.svg";
import { ReactComponent as TabletIcon } from "assets/icons/ads/tablet.svg";
import { ReactComponent as FluidIcon } from "assets/icons/ads/fluid.svg";
import { ReactComponent as CardContextMenu } from "assets/icons/ads/card-context-menu.svg";
import { ReactComponent as SendButton } from "assets/icons/comments/send-button.svg";
import { ReactComponent as Pin } from "assets/icons/comments/pin.svg";
import { ReactComponent as TrashOutline } from "assets/icons/form/trash.svg";
import { ReactComponent as ReadPin } from "assets/icons/comments/read-pin.svg";
import { ReactComponent as UnreadPin } from "assets/icons/comments/unread-pin.svg";
// import { ReactComponent as DownArrow2 } from "assets/icons/comments/down-arrow.svg";
import { ReactComponent as Chat } from "assets/icons/comments/chat.svg";
import { ReactComponent as Unpin } from "assets/icons/comments/unpinIcon.svg";
import { ReactComponent as Reaction } from "assets/icons/comments/reaction.svg";
import { ReactComponent as Reaction2 } from "assets/icons/comments/reaction-2.svg";
import { ReactComponent as Upload } from "assets/icons/ads/upload.svg";
// import { ReactComponent as Download } from "assets/icons/ads/download.svg";
import { ReactComponent as ArrowForwardIcon } from "assets/icons/control/arrow_forward.svg";
import { ReactComponent as DoubleArrowRightIcon } from "assets/icons/ads/double-arrow-right.svg";
import { ReactComponent as CapSolidIcon } from "assets/icons/control/cap_solid.svg";
import { ReactComponent as CapDotIcon } from "assets/icons/control/cap_dot.svg";
import { ReactComponent as LineDottedIcon } from "assets/icons/control/line_dotted.svg";
import { ReactComponent as LineDashedIcon } from "assets/icons/control/line_dashed.svg";
import { ReactComponent as TableIcon } from "assets/icons/ads/tables.svg";
import { ReactComponent as ColumnIcon } from "assets/icons/ads/column.svg";
import { ReactComponent as GearIcon } from "assets/icons/ads/gear.svg";
import { ReactComponent as UserV2Icon } from "assets/icons/ads/user-v2.svg";
import { ReactComponent as SupportIcon } from "assets/icons/ads/support.svg";
import { ReactComponent as Snippet } from "assets/icons/ads/snippet.svg";
import { ReactComponent as WorkspaceIcon } from "assets/icons/ads/organizationIcon.svg";
import { ReactComponent as SettingIcon } from "assets/icons/control/settings.svg";
import { ReactComponent as DropdownIcon } from "assets/icons/ads/dropdown.svg";

import styled from "styled-components";
import { CommonComponentProps, Classes } from "./common";
import { noop } from "lodash";
import { theme } from "constants/DefaultTheme";
import Spinner from "./Spinner";
import { ControlIcons } from "icons/ControlIcons";

// remix icons
import AddMoreIcon from "remixicon-react/AddCircleLineIcon";
import AddMoreFillIcon from "remixicon-react/AddCircleFillIcon";
import ArrowLeftRightIcon from "remixicon-react/ArrowLeftRightLineIcon";
import ArrowDownLineIcon from "remixicon-react/ArrowDownLineIcon";
import BookIcon from "remixicon-react/BookOpenLineIcon";
import ChevronRight from "remixicon-react/ArrowRightSFillIcon";
import CheckLineIcon from "remixicon-react/CheckLineIcon";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
import CloseCircleIcon from "remixicon-react/CloseCircleFillIcon";
import CommentContextMenu from "remixicon-react/More2FillIcon";
import ContextMenuIcon from "remixicon-react/MoreFillIcon";
import CreateNewIcon from "remixicon-react/AddLineIcon";
import Database2Line from "remixicon-react/Database2LineIcon";
import DatasourceIcon from "remixicon-react/CloudFillIcon";
import DeleteBin7 from "remixicon-react/DeleteBin7LineIcon";
import DiscordIcon from "remixicon-react/DiscordLineIcon";
import DownArrow from "remixicon-react/ArrowDownSFillIcon";
import Download from "remixicon-react/DownloadCloud2LineIcon";
import DuplicateIcon from "remixicon-react/FileCopyLineIcon";
import EditIcon from "remixicon-react/PencilFillIcon";
import EditLineIcon from "remixicon-react/EditLineIcon";
import Emoji from "remixicon-react/EmotionLineIcon";
import ExpandMore from "remixicon-react/ArrowDownSLineIcon";
import ExpandLess from "remixicon-react/ArrowUpSLineIcon";
import EyeOn from "remixicon-react/EyeLineIcon";
import EyeOff from "remixicon-react/EyeOffLineIcon";
import FileTransfer from "remixicon-react/FileTransferLineIcon";
import Filter from "remixicon-react/Filter2FillIcon";
import GitMerge from "remixicon-react/GitMergeLineIcon";
import GitCommit from "remixicon-react/GitCommitLineIcon";
import GitPullRequst from "remixicon-react/GitPullRequestLineIcon";
import GuideIcon from "remixicon-react/GuideFillIcon";
import HelpIcon from "remixicon-react/QuestionMarkIcon";
import LightbulbFlashLine from "remixicon-react/LightbulbFlashLineIcon";
import InfoIcon from "remixicon-react/InformationLineIcon";
import KeyIcon from "remixicon-react/Key2LineIcon";
import LeftArrowIcon2 from "remixicon-react/ArrowLeftSLineIcon";
import Link2 from "remixicon-react/LinkIcon";
import LeftArrowIcon from "remixicon-react/ArrowLeftLineIcon";
import More2FillIcon from "remixicon-react/More2FillIcon";
import NewsPaperLine from "remixicon-react/NewspaperLineIcon";
import OvalCheck from "remixicon-react/CheckboxCircleLineIcon";
import OvalCheckFill from "remixicon-react/CheckboxCircleFillIcon";
import Pin3 from "remixicon-react/Pushpin2FillIcon";
import QueryIcon from "remixicon-react/CodeSSlashLineIcon";
import RightArrowIcon from "remixicon-react/ArrowRightLineIcon";
import RightArrowIcon2 from "remixicon-react/ArrowRightSLineIcon";
import RocketIcon from "remixicon-react/RocketLineIcon";
import ShareBoxFillIcon from "remixicon-react/ShareBoxFillIcon";
import ShareForwardIcon from "remixicon-react/ShareForwardFillIcon";
import Trash from "remixicon-react/DeleteBinLineIcon";
import UpArrow from "remixicon-react/ArrowUpSFillIcon";
import WarningIcon from "remixicon-react/ErrorWarningFillIcon";
import EditUnderlineIcon from "remixicon-react/EditLineIcon";
import LogoutIcon from "remixicon-react/LogoutBoxRLineIcon";
import ShareLineIcon from "remixicon-react/ShareLineIcon";
import DownArrowIcon from "remixicon-react/ArrowDownSLineIcon";
import LoaderLineIcon from "remixicon-react/LoaderLineIcon";
import WidgetIcon from "remixicon-react/FunctionLineIcon";
import RefreshLineIcon from "remixicon-react/RefreshLineIcon";
import GitBranchLineIcon from "remixicon-react/GitBranchLineIcon";
import EditBoxLineIcon from "remixicon-react/EditBoxLineIcon";
import StarLineIcon from "remixicon-react/StarLineIcon";
import StarFillIcon from "remixicon-react/StarFillIcon";
import Settings2LineIcon from "remixicon-react/Settings2LineIcon";

export enum IconSize {
  XXS = "extraExtraSmall",
  XS = "extraSmall",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  XL = "extraLarge",
  XXL = "extraExtraLarge",
  XXXL = "extraExtraExtraLarge",
  XXXXL = "extraExtraExtraExtraLarge",
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
    case IconSize.XXXXL:
      iconSize = theme.iconSizes.XXXXL;
      break;
    default:
      iconSize = theme.iconSizes.SMALL;
      break;
  }
  return iconSize;
};

export const IconCollection = [
  "HEADING_ONE",
  "HEADING_THREE",
  "HEADING_TWO",
  "PARAGRAPH",
  "PARAGRAPH_TWO",
  "add-more",
  "add-more-fill",
  "arrow-forward",
  "arrow-left",
  "double-arrow-right",
  "swap-horizontal",
  "billing",
  "book",
  "book-line",
  "bug",
  "cancel",
  "cap-dot",
  "cap-solid",
  "card-context-menu",
  "chat",
  "checkbox-circle-line",
  "check-line",
  "chevron-left",
  "chevron-right",
  "close",
  "close-circle",
  "close-modal",
  "close-x",
  "column",
  "comment-context-menu",
  "context-menu",
  "cross",
  "danger",
  "database-2-line",
  "datasource",
  "delete",
  "delete-blank",
  "desktop",
  "discord",
  "down-arrow-2",
  "downArrow",
  "download",
  "duplicate",
  "edit",
  "edit-line",
  "edit-box-line",
  "emoji",
  "error",
  "expand-less",
  "expand-more",
  "eye-on",
  "eye-off",
  "file-transfer",
  "filter",
  "fluid",
  "fork",
  "gear",
  "general",
  "git-branch",
  "git-commit",
  "git-pull-request",
  "guide",
  "help",
  "info",
  "invite-user",
  "left-arrow",
  "left-arrow-2",
  "lightning",
  "line-dashed",
  "line-dotted",
  "lightbulb-flash-line",
  "link",
  "link-2",
  "logout",
  "manage",
  "mobile",
  "more-2-fill",
  "news-paper",
  "no-response",
  "open",
  "oval-check",
  "oval-check-fill",
  "pin",
  "pin-3",
  "play",
  "plus",
  "query",
  "reaction",
  "reaction-2",
  "read-pin",
  "right-arrow",
  "right-arrow-2",
  "rocket",
  "search",
  "send-button",
  "settings-2-line",
  "share",
  "share-2",
  "share-box",
  "share-line",
  "shine",
  "star-line",
  "star-fill",
  "success",
  "support",
  "tables",
  "tablet",
  "trash",
  "trash-outline",
  "trending-flat",
  "unpin",
  "unread-pin",
  "upArrow",
  "upload",
  "user",
  "user-2",
  "view-all",
  "view-less",
  "wand",
  "warning",
  "warning-triangle",
  "workspace",
  "git-branch",
  "snippet",
  "edit-underline",
  "down-arrow",
  "loader",
  "setting",
  "widget",
  "dropdown",
  "refresh",
  "key",
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
          fill: ${props.fillColor || ""};
          circle {
            fill: ${props.fillColor || ""};
          }
          path {
            fill: ${props.fillColor || ""};
          }
          `
        : ""};
    ${(props) => (props.invisible ? `visibility: hidden;` : null)};
    &:hover {
      cursor: ${(props) => (props.clickable ? "pointer" : "default")};
      ${(props) =>
        !props.keepColors
          ? `
            fill: ${props.hoverFillColor || ""};
            path {
              fill: ${props.hoverFillColor || ""};
            }
          `
          : ""}
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
  hoverFillColor?: string;
  keepColors?: boolean;
  loaderWithIconWrapper?: boolean;
  clickable?: boolean;
};

const Icon = forwardRef(
  (props: IconProps & CommonComponentProps, ref: Ref<HTMLSpanElement>) => {
    let returnIcon;
    switch (props.name) {
      case "HEADING_ONE":
      case "HEADING_TWO":
      case "HEADING_THREE":
      case "PARAGRAPH":
      case "PARAGRAPH_TWO":
        const ControlIcon = ControlIcons[props.name];
        returnIcon = <ControlIcon height={24} width={24} />;
        break;
      case "add-more":
        returnIcon = <AddMoreIcon />;
        break;
      case "add-more-fill":
        returnIcon = <AddMoreFillIcon />;
        break;
      case "arrow-forward":
        returnIcon = <ArrowForwardIcon />;
        break;
      case "double-arrow-right":
        returnIcon = <DoubleArrowRightIcon />;
        break;
      case "arrow-left":
        returnIcon = <ArrowLeft />;
        break;
      case "swap-horizontal":
        returnIcon = <ArrowLeftRightIcon />;
        break;
      case "billing":
        returnIcon = <BillingIcon />;
        break;
      case "book":
        returnIcon = <BookIcon />;
        break;
      case "book-line":
        returnIcon = <BookLineIcon />;
        break;
      case "bug":
        returnIcon = <BugIcon />;
        break;
      case "cancel":
        returnIcon = <CancelIcon />;
        break;
      case "cap-dot":
        returnIcon = <CapDotIcon />;
        break;
      case "cap-solid":
        returnIcon = <CapSolidIcon />;
        break;
      case "card-context-menu":
        returnIcon = <CardContextMenu />;
        break;
      case "chat":
        returnIcon = <Chat />;
        break;
      case "check-line":
        returnIcon = <CheckLineIcon />;
        break;
      case "chevron-left":
        returnIcon = <ChevronLeft />;
        break;
      case "chevron-right":
        returnIcon = <ChevronRight />;
        break;
      case "close":
        returnIcon = <CloseIcon />;
        break;
      case "close-circle":
        returnIcon = <CloseCircleIcon />;
        break;
      case "close-modal":
      case "close-x":
        returnIcon = <CloseLineIcon />;
        break;
      case "column":
        returnIcon = <ColumnIcon />;
        break;
      case "comment-context-menu":
        returnIcon = <CommentContextMenu />;
        break;
      case "context-menu":
        returnIcon = <ContextMenuIcon />;
        break;
      case "cross":
        returnIcon = <CrossIcon />;
        break;
      case "danger":
        returnIcon = <ErrorIcon />;
        break;
      case "database-2-line":
        returnIcon = <Database2Line />;
        break;
      case "datasource":
        returnIcon = <DatasourceIcon />;
        break;
      case "delete":
        returnIcon = <Trash />;
        break;
      case "delete-blank":
        returnIcon = <DeleteBin7 />;
        break;
      case "desktop":
        returnIcon = <DesktopIcon />;
        break;
      case "discord":
        returnIcon = <DiscordIcon />;
        break;
      case "down-arrow-2":
        returnIcon = <ArrowDownLineIcon />;
        break;
      case "downArrow":
        returnIcon = <DownArrow />;
        break;
      case "download":
        returnIcon = <Download />;
        break;
      case "duplicate":
        returnIcon = <DuplicateIcon />;
        break;
      case "edit":
        returnIcon = <EditIcon />;
        break;
      case "edit-line":
        returnIcon = <EditLineIcon />;
        break;
      case "edit-box-line":
        returnIcon = <EditBoxLineIcon />;
        break;
      case "emoji":
        returnIcon = <Emoji />;
        break;
      case "error":
        returnIcon = <ErrorIcon />;
        break;
      case "expand-less":
        returnIcon = <ExpandLess />;
        break;
      case "expand-more":
        returnIcon = <ExpandMore />;
        break;
      case "eye-on":
        returnIcon = <EyeOn />;
        break;
      case "eye-off":
        returnIcon = <EyeOff />;
        break;
      case "file-transfer":
        returnIcon = <FileTransfer />;
        break;
      case "filter":
        returnIcon = <Filter />;
        break;
      case "fluid":
        returnIcon = <FluidIcon />;
        break;
      case "fork":
        returnIcon = <GitMerge />;
        break;
      case "gear":
        returnIcon = <GearIcon />;
        break;
      case "general":
        returnIcon = <GeneralIcon />;
        break;
      case "git-branch":
        returnIcon = <GitBranchLineIcon />;
        break;
      case "git-commit":
        returnIcon = <GitCommit />;
        break;
      case "git-pull-request":
        returnIcon = <GitPullRequst />;
        break;
      case "guide":
        returnIcon = <GuideIcon />;
        break;
      case "help":
        returnIcon = <HelpIcon />;
        break;
      case "info":
        returnIcon = <InfoIcon />;
        break;
      case "invite-user":
        returnIcon = <InviteUserIcon />;
        break;
      case "key":
        returnIcon = <KeyIcon />;
        break;
      case "left-arrow-2":
        returnIcon = <LeftArrowIcon2 />;
        break;
      case "lightning":
        returnIcon = <LightningIcon />;
        break;
      case "lightbulb-flash-line":
        returnIcon = <LightbulbFlashLine />;
        break;
      case "line-dashed":
        returnIcon = <LineDashedIcon />;
        break;
      case "line-dotted":
        returnIcon = <LineDottedIcon />;
        break;
      case "link":
        returnIcon = <LinkIcon />;
        break;
      case "link-2":
        returnIcon = <Link2 />;
        break;
      case "logout":
        returnIcon = <LogoutIcon />;
        break;
      case "manage":
        returnIcon = <ManageIcon />;
        break;
      case "mobile":
        returnIcon = <MobileIcon />;
        break;
      case "more-2-fill":
        returnIcon = <More2FillIcon />;
        break;
      case "news-paper":
        returnIcon = <NewsPaperLine />;
        break;
      case "no-response":
        returnIcon = <NoResponseIcon />;
        break;
      case "open":
        returnIcon = <OpenIcon />;
        break;
      case "oval-check":
        returnIcon = <OvalCheck />;
        break;
      case "oval-check-fill":
        returnIcon = <OvalCheckFill />;
        break;
      case "pin":
        returnIcon = <Pin />;
        break;
      case "pin-3":
        returnIcon = <Pin3 />;
        break;
      case "play":
        returnIcon = <PlayIcon />;
        break;
      case "plus":
        returnIcon = <CreateNewIcon />;
        break;
      case "query":
        returnIcon = <QueryIcon />;
        break;
      case "reaction":
        returnIcon = <Reaction />;
        break;
      case "reaction-2":
        returnIcon = <Reaction2 />;
        break;
      case "read-pin":
        returnIcon = <ReadPin />;
        break;
      case "right-arrow":
        returnIcon = <RightArrowIcon />;
        break;
      case "right-arrow-2":
        returnIcon = <RightArrowIcon2 />;
        break;
      case "rocket":
        returnIcon = <RocketIcon />;
        break;
      case "search":
        returnIcon = <SearchIcon />;
        break;
      case "send-button":
        returnIcon = <SendButton />;
        break;
      case "settings-2-line":
        returnIcon = <Settings2LineIcon />;
        break;
      case "share":
        returnIcon = <ShareForwardIcon />;
        break;
      case "share-2":
        returnIcon = <ShareIcon2 />;
        break;
      case "share-box":
        returnIcon = <ShareBoxFillIcon />;
        break;
      case "share-line":
        returnIcon = <ShareLineIcon />;
        break;
      case "shine":
        returnIcon = <ShineIcon />;
        break;
      case "star-line":
        returnIcon = <StarLineIcon />;
        break;
      case "star-fill":
        returnIcon = <StarFillIcon />;
        break;
      case "success":
        returnIcon = <SuccessIcon />;
        break;
      case "support":
        returnIcon = <SupportIcon />;
        break;
      case "tables":
        returnIcon = <TableIcon />;
        break;
      case "tablet":
        returnIcon = <TabletIcon />;
        break;
      case "trash":
        returnIcon = <Trash />;
        break;
      case "trash-outline":
        returnIcon = <TrashOutline />;
        break;
      case "trending-flat":
        returnIcon = <TrendingFlat />;
        break;
      case "unpin":
        returnIcon = <Unpin />;
        break;
      case "unread-pin":
        returnIcon = <UnreadPin />;
        break;
      case "upArrow":
        returnIcon = <UpArrow />;
        break;
      case "upload":
        returnIcon = <Upload />;
        break;
      case "user":
        returnIcon = <UserIcon />;
        break;
      case "user-2":
        returnIcon = <UserV2Icon />;
        break;
      case "view-all":
        returnIcon = <RightArrowIcon />;
        break;
      case "view-less":
        returnIcon = <LeftArrowIcon />;
        break;
      case "wand":
        returnIcon = <WandIcon />;
        break;
      case "warning":
        returnIcon = <WarningIcon />;
        break;
      case "warning-triangle":
        returnIcon = <WarningTriangleIcon />;
        break;
      case "setting":
        returnIcon = <SettingIcon />;
        break;
      case "workspace":
        returnIcon = <WorkspaceIcon />;
        break;
      case "snippet":
        returnIcon = <Snippet />;
        break;
      case "edit-underline":
        returnIcon = <EditUnderlineIcon />;
        break;
      case "down-arrow":
        returnIcon = <DownArrowIcon />;
        break;
      case "loader":
        returnIcon = <LoaderLineIcon />;
        break;
      case "widget":
        returnIcon = <WidgetIcon />;
        break;
      case "dropdown":
        returnIcon = <DropdownIcon />;
        break;
      case "refresh":
        returnIcon = <RefreshLineIcon />;
        break;
      default:
        returnIcon = null;
        break;
    }

    const clickable = props.clickable === undefined ? true : props.clickable;

    let loader = <Spinner size={props.size} />;
    if (props.loaderWithIconWrapper) {
      loader = (
        <IconWrapper className={Classes.ICON} clickable={clickable} {...props}>
          <Spinner size={props.size} />
        </IconWrapper>
      );
    }

    return returnIcon && !props.isLoading ? (
      <IconWrapper
        className={`${Classes.ICON} ${props.className}`}
        clickable={clickable}
        data-cy={props.cypressSelector}
        ref={ref}
        {...props}
        onClick={props.onClick || noop}
      >
        {returnIcon}
      </IconWrapper>
    ) : props.isLoading ? (
      loader
    ) : null;
  },
);

Icon.displayName = "Icon";

export default Icon;

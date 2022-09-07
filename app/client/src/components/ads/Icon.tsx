import React, { forwardRef, Ref } from "react";
// import { ReactComponent as DeleteIcon } from "assets/icons/ads/delete.svg";
import { ReactComponent as BookLineIcon } from "assets/icons/ads/book-open-line.svg";
import { ReactComponent as BugIcon } from "assets/icons/ads/bug.svg";
import { ReactComponent as CancelIcon } from "assets/icons/ads/cancel.svg";
// import { ReactComponent as ExpandMore } from "assets/icons/ads/expand-more.svg";
import { ReactComponent as CrossIcon } from "assets/icons/ads/cross.svg";
import { ReactComponent as Fork2Icon } from "assets/icons/ads/fork-2.svg";
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
import { ReactComponent as TrashOutline } from "assets/icons/form/trash.svg";
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
import { ReactComponent as WorkspaceIcon } from "assets/icons/ads/workspaceIcon.svg";
import { ReactComponent as SettingIcon } from "assets/icons/control/settings.svg";
import { ReactComponent as DropdownIcon } from "assets/icons/ads/dropdown.svg";
import { ReactComponent as ChatIcon } from "assets/icons/ads/app-icons/chat.svg";
import { ReactComponent as JsIcon } from "assets/icons/ads/js.svg";

import styled from "styled-components";
import { Classes, CommonComponentProps } from "./common";
import { noop } from "lodash";
import { theme } from "constants/DefaultTheme";
import Spinner from "./Spinner";
import { ControlIcons } from "icons/ControlIcons";

// remix icons
import AddMoreIcon from "remixicon-react/AddCircleLineIcon";
import AddMoreFillIcon from "remixicon-react/AddCircleFillIcon";
// import AlertFillIcon from "remixicon-react/AlertFillIcon";
import ArrowLeftRightIcon from "remixicon-react/ArrowLeftRightLineIcon";
import ArrowDownLineIcon from "remixicon-react/ArrowDownLineIcon";
import BookIcon from "remixicon-react/BookOpenLineIcon";
import ChevronRight from "remixicon-react/ArrowRightSFillIcon";
import CheckLineIcon from "remixicon-react/CheckLineIcon";
import CloseLineIcon from "remixicon-react/CloseLineIcon";
import CloseCircleIcon from "remixicon-react/CloseCircleFillIcon";
import CommentContextMenu from "remixicon-react/More2FillIcon";
import More2FillIcon from "remixicon-react/More2FillIcon";
import CompassesLine from "remixicon-react/CompassesLineIcon";
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
import EditUnderlineIcon from "remixicon-react/EditLineIcon";
import Emoji from "remixicon-react/EmotionLineIcon";
import ExpandMore from "remixicon-react/ArrowDownSLineIcon";
import DownArrowIcon from "remixicon-react/ArrowDownSLineIcon";
import ExpandLess from "remixicon-react/ArrowUpSLineIcon";
import EyeOn from "remixicon-react/EyeLineIcon";
import EyeOff from "remixicon-react/EyeOffLineIcon";
import FileTransfer from "remixicon-react/FileTransferLineIcon";
import FileLine from "remixicon-react/FileLineIcon";
import Filter from "remixicon-react/Filter2FillIcon";
import GitMerge from "remixicon-react/GitMergeLineIcon";
import GitCommit from "remixicon-react/GitCommitLineIcon";
import GitPullRequst from "remixicon-react/GitPullRequestLineIcon";
import GuideIcon from "remixicon-react/GuideFillIcon";
import HelpIcon from "remixicon-react/QuestionMarkIcon";
// import HelpFillIcon from "remixicon-react/QuestionFillIcon";
import LightbulbFlashLine from "remixicon-react/LightbulbFlashLineIcon";
import InfoIcon from "remixicon-react/InformationLineIcon";
import KeyIcon from "remixicon-react/Key2LineIcon";
import LeftArrowIcon2 from "remixicon-react/ArrowLeftSLineIcon";
import Link2 from "remixicon-react/LinkIcon";
import LeftArrowIcon from "remixicon-react/ArrowLeftLineIcon";
import NewsPaperLine from "remixicon-react/NewspaperLineIcon";
import OvalCheck from "remixicon-react/CheckboxCircleLineIcon";
import OvalCheckFill from "remixicon-react/CheckboxCircleFillIcon";
import Pin3 from "remixicon-react/Pushpin2FillIcon";
import QueryIcon from "remixicon-react/CodeSSlashLineIcon";
import RemoveIcon from "remixicon-react/SubtractLineIcon";
import RightArrowIcon from "remixicon-react/ArrowRightLineIcon";
import RightArrowIcon2 from "remixicon-react/ArrowRightSLineIcon";
import RocketIcon from "remixicon-react/RocketLineIcon";
import ShareBoxFillIcon from "remixicon-react/ShareBoxFillIcon";
import ShareForwardIcon from "remixicon-react/ShareForwardFillIcon";
import Trash from "remixicon-react/DeleteBinLineIcon";
import UpArrow from "remixicon-react/ArrowUpSFillIcon";
import WarningIcon from "remixicon-react/ErrorWarningFillIcon";
import WarningLineIcon from "remixicon-react/ErrorWarningLineIcon";
import LogoutIcon from "remixicon-react/LogoutBoxRLineIcon";
import ShareLineIcon from "remixicon-react/ShareLineIcon";
import LoaderLineIcon from "remixicon-react/LoaderLineIcon";
import WidgetIcon from "remixicon-react/FunctionLineIcon";
import RefreshLineIcon from "remixicon-react/RefreshLineIcon";
import GitBranchLineIcon from "remixicon-react/GitBranchLineIcon";
import EditBoxLineIcon from "remixicon-react/EditBoxLineIcon";
import StarLineIcon from "remixicon-react/StarLineIcon";
import StarFillIcon from "remixicon-react/StarFillIcon";
import Settings2LineIcon from "remixicon-react/Settings2LineIcon";
import DownloadIcon from "remixicon-react/DownloadLineIcon";
import UploadCloud2LineIcon from "remixicon-react/UploadCloud2LineIcon";
import DownloadLineIcon from "remixicon-react/DownloadLineIcon";
import FileListLineIcon from "remixicon-react/FileListLineIcon";
import HamburgerIcon from "remixicon-react/MenuLineIcon";
import MagicLineIcon from "remixicon-react/MagicLineIcon";
import UserHeartLineIcon from "remixicon-react/UserHeartLineIcon";
import DvdLineIcon from "remixicon-react/DvdLineIcon";
import Group2LineIcon from "remixicon-react/Group2LineIcon";
import CodeViewIcon from "remixicon-react/CodeViewIcon";

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

const ICON_SIZE_LOOKUP = {
  [IconSize.XXS]: theme.iconSizes.XXS,
  [IconSize.XS]: theme.iconSizes.XS,
  [IconSize.SMALL]: theme.iconSizes.SMALL,
  [IconSize.MEDIUM]: theme.iconSizes.MEDIUM,
  [IconSize.LARGE]: theme.iconSizes.LARGE,
  [IconSize.XL]: theme.iconSizes.XL,
  [IconSize.XXL]: theme.iconSizes.XXL,
  [IconSize.XXXL]: theme.iconSizes.XXXL,
  [IconSize.XXXXL]: theme.iconSizes.XXXXL,
  undefined: theme.iconSizes.SMALL,
};

export const sizeHandler = (size?: IconSize): number => {
  return (
    ICON_SIZE_LOOKUP[size as keyof typeof ICON_SIZE_LOOKUP] ||
    theme.iconSizes.SMALL
  );
};

export const IconWrapper = styled.span<IconProps>`
  &:focus {
    outline: none;
  }

  display: flex;
  align-items: center;
  cursor: ${(props) =>
    props.disabled ? "not-allowed" : props.clickable ? "pointer" : "default"};
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

function getControlIcon(iconName: string) {
  const ControlIcon = ControlIcons[iconName];
  return <ControlIcon height={24} width={24} />;
}

const ICON_LOOKUP = {
  undefined: null,
  HEADING_ONE: getControlIcon("HEADING_ONE"),
  HEADING_THREE: getControlIcon("HEADING_THREE"),
  HEADING_TWO: getControlIcon("HEADING_TWO"),
  PARAGRAPH: getControlIcon("PARAGRAPH"),
  PARAGRAPH_TWO: getControlIcon("PARAGRAPH_TWO"),
  "add-more": <AddMoreIcon />,
  "add-more-fill": <AddMoreFillIcon />,
  "arrow-forward": <ArrowForwardIcon />,
  "arrow-left": <ArrowLeft />,
  "book-line": <BookLineIcon />,
  "cap-dot": <CapDotIcon />,
  "cap-solid": <CapSolidIcon />,
  "card-context-menu": <CardContextMenu />,
  "check-line": <CheckLineIcon />,
  "chevron-left": <ChevronLeft />,
  "chevron-right": <ChevronRight />,
  "close-circle": <CloseCircleIcon />,
  "close-modal": <CloseLineIcon />,
  "close-x": <CloseLineIcon />,
  "comment-context-menu": <CommentContextMenu />,
  "compasses-line": <CompassesLine />,
  "context-menu": <ContextMenuIcon />,
  "database-2-line": <Database2Line />,
  "delete-blank": <DeleteBin7 />,
  "double-arrow-right": <DoubleArrowRightIcon />,
  "down-arrow": <DownArrowIcon />,
  "down-arrow-2": <ArrowDownLineIcon />,
  "download-line": <DownloadLineIcon />,
  "edit-box-line": <EditBoxLineIcon />,
  "edit-line": <EditLineIcon />,
  "edit-underline": <EditUnderlineIcon />,
  "expand-less": <ExpandLess />,
  "expand-more": <ExpandMore />,
  "eye-off": <EyeOff />,
  "eye-on": <EyeOn />,
  "file-line": <FileLine />,
  "file-list-line": <FileListLineIcon />,
  "fork-2": <Fork2Icon />,
  "file-transfer": <FileTransfer />,
  "git-branch": <GitBranchLineIcon />,
  "git-commit": <GitCommit />,
  "git-pull-request": <GitPullRequst />,
  "invite-user": <InviteUserIcon />,
  "left-arrow-2": <LeftArrowIcon2 />,
  "lightbulb-flash-line": <LightbulbFlashLine />,
  "line-dashed": <LineDashedIcon />,
  "line-dotted": <LineDottedIcon />,
  "link-2": <Link2 />,
  "magic-line": <MagicLineIcon />,
  "more-2-fill": <More2FillIcon />,
  "news-paper": <NewsPaperLine />,
  "no-response": <NoResponseIcon />,
  "oval-check": <OvalCheck />,
  "oval-check-fill": <OvalCheckFill />,
  "pin-3": <Pin3 />,
  "right-arrow": <RightArrowIcon />,
  "right-arrow-2": <RightArrowIcon2 />,
  "settings-2-line": <Settings2LineIcon />,
  "share-2": <ShareIcon2 />,
  "share-box": <ShareBoxFillIcon />,
  "share-line": <ShareLineIcon />,
  "star-fill": <StarFillIcon />,
  "star-line": <StarLineIcon />,
  "swap-horizontal": <ArrowLeftRightIcon />,
  "trash-outline": <TrashOutline />,
  "trending-flat": <TrendingFlat />,
  "upload-cloud": <UploadCloud2LineIcon />,
  "user-2": <UserV2Icon />,
  "user-heart-line": <UserHeartLineIcon />,
  "view-all": <RightArrowIcon />,
  "view-less": <LeftArrowIcon />,
  "warning-line": <WarningLineIcon />,
  "warning-triangle": <WarningTriangleIcon />,
  "chat-help": <ChatIcon />,
  "group-2-line": <Group2LineIcon />,
  billing: <BillingIcon />,
  book: <BookIcon />,
  bug: <BugIcon />,
  cancel: <CancelIcon />,
  close: <CloseIcon />,
  code: <CodeViewIcon />,
  column: <ColumnIcon />,
  cross: <CrossIcon />,
  danger: <ErrorIcon />,
  datasource: <DatasourceIcon />,
  delete: <Trash />,
  desktop: <DesktopIcon />,
  discord: <DiscordIcon />,
  downArrow: <DownArrow />,
  download: <Download />,
  dropdown: <DropdownIcon />,
  duplicate: <DuplicateIcon />,
  edit: <EditIcon />,
  emoji: <Emoji />,
  enterprise: <MagicLineIcon />,
  error: <ErrorIcon />,
  filter: <Filter />,
  fluid: <FluidIcon />,
  fork: <GitMerge />,
  gear: <GearIcon />,
  general: <GeneralIcon />,
  guide: <GuideIcon />,
  hamburger: <HamburgerIcon />,
  help: <HelpIcon />,
  info: <InfoIcon />,
  js: <JsIcon />,
  key: <KeyIcon />,
  lightning: <LightningIcon />,
  link: <LinkIcon />,
  loader: <LoaderLineIcon />,
  logout: <LogoutIcon />,
  manage: <ManageIcon />,
  member: <UserHeartLineIcon />,
  minus: <RemoveIcon />,
  mobile: <MobileIcon />,
  open: <OpenIcon />,
  play: <PlayIcon />,
  plus: <CreateNewIcon />,
  query: <QueryIcon />,
  refresh: <RefreshLineIcon />,
  rocket: <RocketIcon />,
  search: <SearchIcon />,
  setting: <SettingIcon />,
  share: <ShareForwardIcon />,
  shine: <ShineIcon />,
  snippet: <Snippet />,
  success: <SuccessIcon />,
  support: <SupportIcon />,
  tables: <TableIcon />,
  tablet: <TabletIcon />,
  trash: <Trash />,
  upArrow: <UpArrow />,
  upload: <Upload />,
  user: <UserIcon />,
  wand: <WandIcon />,
  warning: <WarningIcon />,
  widget: <WidgetIcon />,
  workspace: <WorkspaceIcon />,
  download2: <DownloadIcon />,
  upgrade: <DvdLineIcon />,
};

export const IconCollection = Object.keys(ICON_LOOKUP);

export type IconName = typeof IconCollection[number];

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
  disabled?: boolean;
};

const Icon = forwardRef(
  (
    { onClick, ...props }: IconProps & CommonComponentProps,
    ref: Ref<HTMLSpanElement>,
  ) => {
    const iconName = props.name;
    const returnIcon =
      ICON_LOOKUP[iconName as keyof typeof ICON_LOOKUP] || null;

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
        onClick={props.disabled ? noop : onClick}
        ref={ref}
        {...props}
      >
        {returnIcon}
      </IconWrapper>
    ) : props.isLoading ? (
      loader
    ) : null;
  },
);

Icon.displayName = "Icon";

export default React.memo(Icon);

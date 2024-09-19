import type { Ref } from "react";
import React, { forwardRef } from "react";
import styled from "styled-components";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";
import { noop } from "lodash";
import Spinner from "../Spinner";
import { ControlIcons } from "../ControlIcons";
import { importRemixIcon, importSvg } from "../utils/icon-loadables";
const ClearInterval = importSvg(
  async () => import("../assets/icons/action/clearInterval.svg"),
);
const ClearStore = importSvg(
  async () => import("../assets/icons/action/clearStore.svg"),
);
const CopyToClipboard = importSvg(
  async () => import("../assets/icons/action/copyToClipboard.svg"),
);
const DownloadAction = importSvg(
  async () => import("../assets/icons/action/download.svg"),
);
const ExecuteJs = importSvg(
  async () => import("../assets/icons/action/executeJs.svg"),
);
const ExecuteQuery = importSvg(
  async () => import("../assets/icons/action/executeQuery.svg"),
);
const GetGeolocation = importSvg(
  async () => import("../assets/icons/action/getGeolocation.svg"),
);
const Modal = importSvg(async () => import("../assets/icons/action/modal.svg"));
const NavigateTo = importSvg(
  async () => import("../assets/icons/action/navigateTo.svg"),
);
const RemoveStore = importSvg(
  async () => import("../assets/icons/action/removeStore.svg"),
);
const ResetWidget = importSvg(
  async () => import("../assets/icons/action/resetWidget.svg"),
);
const SetInterval = importSvg(
  async () => import("../assets/icons/action/setInterval.svg"),
);
const ShowAlert = importSvg(
  async () => import("../assets/icons/action/showAlert.svg"),
);
const StopWatchGeolocation = importSvg(
  async () => import("../assets/icons/action/stopWatchGeolocation.svg"),
);
const StoreValue = importSvg(
  async () => import("../assets/icons/action/storeValue.svg"),
);
const WatchGeolocation = importSvg(
  async () => import("../assets/icons/action/watchGeolocation.svg"),
);
const RunAPI = importSvg(
  async () => import("../assets/icons/action/runApi.svg"),
);
const PostMessage = importSvg(
  async () => import("../assets/icons/action/postMessage.svg"),
);
const NoAction = importSvg(
  async () => import("../assets/icons/action/noAction.svg"),
);
const BookLineIcon = importSvg(
  async () => import("../assets/icons/ads/book-open-line.svg"),
);
const BugIcon = importSvg(async () => import("../assets/icons/ads/bug.svg"));
const CancelIcon = importSvg(
  async () => import("../assets/icons/ads/cancel.svg"),
);
const CrossIcon = importSvg(
  async () => import("../assets/icons/ads/cross.svg"),
);
const Fork2Icon = importSvg(
  async () => import("../assets/icons/ads/fork-2.svg"),
);
const OpenIcon = importSvg(async () => import("../assets/icons/ads/open.svg"));
const UserIcon = importSvg(async () => import("../assets/icons/ads/user.svg"));
const GeneralIcon = importSvg(
  async () => import("../assets/icons/ads/general.svg"),
);
const BillingIcon = importSvg(
  async () => import("../assets/icons/ads/billing.svg"),
);
const ErrorIcon = importSvg(
  async () => import("../assets/icons/ads/error.svg"),
);
const ShineIcon = importSvg(
  async () => import("../assets/icons/ads/shine.svg"),
);
const SuccessIcon = importSvg(
  async () => import("../assets/icons/ads/success.svg"),
);
const CloseIcon = importSvg(
  async () => import("../assets/icons/ads/close.svg"),
);
const WarningTriangleIcon = importSvg(
  async () => import("../assets/icons/ads/warning-triangle.svg"),
);
const ShareIcon2 = importSvg(
  async () => import("../assets/icons/ads/share-2.svg"),
);
const InviteUserIcon = importSvg(
  async () => import("../assets/icons/ads/invite-users.svg"),
);
const ManageIcon = importSvg(
  async () => import("../assets/icons/ads/manage.svg"),
);
const ArrowLeft = importSvg(
  async () => import("../assets/icons/ads/arrow-left.svg"),
);
const ChevronLeft = importSvg(
  async () => import("../assets/icons/ads/chevron_left.svg"),
);
const LinkIcon = importSvg(async () => import("../assets/icons/ads/link.svg"));
const NoResponseIcon = importSvg(
  async () => import("../assets/icons/ads/no-response.svg"),
);
const LightningIcon = importSvg(
  async () => import("../assets/icons/ads/lightning.svg"),
);
const TrendingFlat = importSvg(
  async () => import("../assets/icons/ads/trending-flat.svg"),
);
const PlayIcon = importSvg(async () => import("../assets/icons/ads/play.svg"));
const DesktopIcon = importSvg(
  async () => import("../assets/icons/ads/desktop.svg"),
);
const WandIcon = importSvg(async () => import("../assets/icons/ads/wand.svg"));
const MobileIcon = importSvg(
  async () => import("../assets/icons/ads/mobile.svg"),
);
const TabletIcon = importSvg(
  async () => import("../assets/icons/ads/tablet.svg"),
);
const TabletLandscapeIcon = importSvg(
  async () => import("../assets/icons/ads/tablet-landscape.svg"),
);
const FluidIcon = importSvg(
  async () => import("../assets/icons/ads/fluid.svg"),
);
const CardContextMenu = importSvg(
  async () => import("../assets/icons/ads/card-context-menu.svg"),
);
const SendButton = importSvg(
  async () => import("../assets/icons/comments/send-button.svg"),
);
const Pin = importSvg(async () => import("../assets/icons/comments/pin.svg"));
const TrashOutline = importSvg(
  async () => import("../assets/icons/form/trash.svg"),
);
const ReadPin = importSvg(
  async () => import("../assets/icons/comments/read-pin.svg"),
);
const UnreadPin = importSvg(
  async () => import("../assets/icons/comments/unread-pin.svg"),
);
const Chat = importSvg(async () => import("../assets/icons/comments/chat.svg"));
const Unpin = importSvg(
  async () => import("../assets/icons/comments/unpinIcon.svg"),
);
const Reaction = importSvg(
  async () => import("../assets/icons/comments/reaction.svg"),
);
const Reaction2 = importSvg(
  async () => import("../assets/icons/comments/reaction-2.svg"),
);
const Upload = importSvg(async () => import("../assets/icons/ads/upload.svg"));
const ArrowForwardIcon = importSvg(
  async () => import("../assets/icons/control/arrow_forward.svg"),
);
const DoubleArrowRightIcon = importSvg(
  async () => import("../assets/icons/ads/double-arrow-right.svg"),
);
const CapSolidIcon = importSvg(
  async () => import("../assets/icons/control/cap_solid.svg"),
);
const CapDotIcon = importSvg(
  async () => import("../assets/icons/control/cap_dot.svg"),
);
const LineDottedIcon = importSvg(
  async () => import("../assets/icons/control/line_dotted.svg"),
);
const LineDashedIcon = importSvg(
  async () => import("../assets/icons/control/line_dashed.svg"),
);
const TableIcon = importSvg(
  async () => import("../assets/icons/ads/tables.svg"),
);
const ColumnIcon = importSvg(
  async () => import("../assets/icons/ads/column.svg"),
);
const GearIcon = importSvg(async () => import("../assets/icons/ads/gear.svg"));
const UserV2Icon = importSvg(
  async () => import("../assets/icons/ads/user-v2.svg"),
);
const SupportIcon = importSvg(
  async () => import("../assets/icons/ads/support.svg"),
);
const Snippet = importSvg(
  async () => import("../assets/icons/ads/snippet.svg"),
);
const WorkspaceIcon = importSvg(
  async () => import("../assets/icons/ads/workspaceIcon.svg"),
);
const SettingIcon = importSvg(
  async () => import("../assets/icons/control/settings.svg"),
);
const DropdownIcon = importSvg(
  async () => import("../assets/icons/ads/dropdown.svg"),
);
const ChatIcon = importSvg(
  async () => import("../assets/icons/ads/app-icons/chat.svg"),
);
const JsIcon = importSvg(async () => import("../assets/icons/ads/js.svg"));
const ExecuteIcon = importSvg(
  async () => import("../assets/icons/ads/execute.svg"),
);
const PackageIcon = importSvg(
  async () => import("../assets/icons/ads/package.svg"),
);

const DevicesIcon = importSvg(
  async () => import("../assets/icons/ads/devices.svg"),
);
const GridIcon = importSvg(async () => import("../assets/icons/ads/grid.svg"));
const HistoryLineIcon = importSvg(
  async () => import("../assets/icons/ads/history-line.svg"),
);
const SuccessLineIcon = importSvg(
  async () => import("../assets/icons/ads/success-line.svg"),
);
const ErrorLineIcon = importSvg(
  async () => import("../assets/icons/ads/error-line.svg"),
);

// remix icons
const AddMoreIcon = importRemixIcon(
  async () => import("remixicon-react/AddCircleLineIcon"),
);
const AddMoreFillIcon = importRemixIcon(
  async () => import("remixicon-react/AddCircleFillIcon"),
);
const ArrowLeftRightIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowLeftRightLineIcon"),
);
const ArrowDownLineIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowDownLineIcon"),
);
const BookIcon = importRemixIcon(
  async () => import("remixicon-react/BookOpenLineIcon"),
);
const BugLineIcon = importRemixIcon(
  async () => import("remixicon-react/BugLineIcon"),
);
const ChevronRight = importRemixIcon(
  async () => import("remixicon-react/ArrowRightSFillIcon"),
);
const CheckLineIcon = importRemixIcon(
  async () => import("remixicon-react/CheckLineIcon"),
);
const CloseLineIcon = importRemixIcon(
  async () => import("remixicon-react/CloseLineIcon"),
);
const CloseCircleIcon = importRemixIcon(
  async () => import("remixicon-react/CloseCircleFillIcon"),
);
const CloseCircleLineIcon = importRemixIcon(
  async () => import("remixicon-react/CloseCircleLineIcon"),
);
const CloudOfflineIcon = importRemixIcon(
  async () => import("remixicon-react/CloudOffLineIcon"),
);
const CommentContextMenu = importRemixIcon(
  async () => import("remixicon-react/More2FillIcon"),
);
const More2FillIcon = importRemixIcon(
  async () => import("remixicon-react/More2FillIcon"),
);
const CompassesLine = importRemixIcon(
  async () => import("remixicon-react/CompassesLineIcon"),
);
const ContextMenuIcon = importRemixIcon(
  async () => import("remixicon-react/MoreFillIcon"),
);
const CreateNewIcon = importRemixIcon(
  async () => import("remixicon-react/AddLineIcon"),
);
const Database2Line = importRemixIcon(
  async () => import("remixicon-react/Database2LineIcon"),
);
const DatasourceIcon = importRemixIcon(
  async () => import("remixicon-react/CloudFillIcon"),
);
const DeleteBin7 = importRemixIcon(
  async () => import("remixicon-react/DeleteBin7LineIcon"),
);
const DiscordIcon = importRemixIcon(
  async () => import("remixicon-react/DiscordLineIcon"),
);
const DownArrow = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSFillIcon"),
);
const Download = importRemixIcon(
  async () => import("remixicon-react/DownloadCloud2LineIcon"),
);
const DuplicateIcon = importRemixIcon(
  async () => import("remixicon-react/FileCopyLineIcon"),
);
const EditIcon = importRemixIcon(
  async () => import("remixicon-react/PencilFillIcon"),
);
const EditLineIcon = importRemixIcon(
  async () => import("remixicon-react/EditLineIcon"),
);
const EditUnderlineIcon = importRemixIcon(
  async () => import("remixicon-react/EditLineIcon"),
);
const Emoji = importRemixIcon(
  async () => import("remixicon-react/EmotionLineIcon"),
);
const ExpandMore = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSLineIcon"),
);
const DownArrowIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSLineIcon"),
);
const ExpandLess = importRemixIcon(
  async () => import("remixicon-react/ArrowUpSLineIcon"),
);
const EyeOn = importRemixIcon(
  async () => import("remixicon-react/EyeLineIcon"),
);
const EyeOff = importRemixIcon(
  async () => import("remixicon-react/EyeOffLineIcon"),
);
const FileTransfer = importRemixIcon(
  async () => import("remixicon-react/FileTransferLineIcon"),
);
const FileLine = importRemixIcon(
  async () => import("remixicon-react/FileLineIcon"),
);
const Filter = importRemixIcon(
  async () => import("remixicon-react/Filter2FillIcon"),
);
const ForbidLineIcon = importRemixIcon(
  async () => import("remixicon-react/ForbidLineIcon"),
);
const GitMerge = importRemixIcon(
  async () => import("remixicon-react/GitMergeLineIcon"),
);
const GitCommit = importRemixIcon(
  async () => import("remixicon-react/GitCommitLineIcon"),
);
const GitPullRequst = importRemixIcon(
  async () => import("remixicon-react/GitPullRequestLineIcon"),
);
const GlobalLineIcon = importRemixIcon(
  async () => import("remixicon-react/GlobalLineIcon"),
);
const GuideIcon = importRemixIcon(
  async () => import("remixicon-react/GuideFillIcon"),
);
const HelpIcon = importRemixIcon(
  async () => import("remixicon-react/QuestionMarkIcon"),
);
const LightbulbFlashLine = importRemixIcon(
  async () => import("remixicon-react/LightbulbFlashLineIcon"),
);
const LinksLineIcon = importRemixIcon(
  async () => import("remixicon-react/LinksLineIcon"),
);
const InfoIcon = importRemixIcon(
  async () => import("remixicon-react/InformationLineIcon"),
);
const KeyIcon = importRemixIcon(
  async () => import("remixicon-react/Key2LineIcon"),
);
const LeftArrowIcon2 = importRemixIcon(
  async () => import("remixicon-react/ArrowLeftSLineIcon"),
);
const Link2 = importRemixIcon(async () => import("remixicon-react/LinkIcon"));
const LeftArrowIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowLeftLineIcon"),
);
const NewsPaperLine = importRemixIcon(
  async () => import("remixicon-react/NewspaperLineIcon"),
);
const OvalCheck = importRemixIcon(
  async () => import("remixicon-react/CheckboxCircleLineIcon"),
);
const OvalCheckFill = importRemixIcon(
  async () => import("remixicon-react/CheckboxCircleFillIcon"),
);
const Pin3 = importRemixIcon(
  async () => import("remixicon-react/Pushpin2FillIcon"),
);
const PlayCircleLineIcon = importRemixIcon(
  async () => import("remixicon-react/PlayCircleLineIcon"),
);
const QueryIcon = importRemixIcon(
  async () => import("remixicon-react/CodeSSlashLineIcon"),
);
const RemoveIcon = importRemixIcon(
  async () => import("remixicon-react/SubtractLineIcon"),
);
const RightArrowIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowRightLineIcon"),
);
const RightArrowIcon2 = importRemixIcon(
  async () => import("remixicon-react/ArrowRightSLineIcon"),
);
const RocketIcon = importRemixIcon(
  async () => import("remixicon-react/RocketLineIcon"),
);
const SearchIcon = importRemixIcon(
  async () => import("remixicon-react/SearchLineIcon"),
);
const SortAscIcon = importRemixIcon(
  async () => import("remixicon-react/SortAscIcon"),
);
const SortDescIcon = importRemixIcon(
  async () => import("remixicon-react/SortDescIcon"),
);
const ShareBoxLineIcon = importRemixIcon(
  async () => import("remixicon-react/ShareBoxLineIcon"),
);
const ShareBoxFillIcon = importRemixIcon(
  async () => import("remixicon-react/ShareBoxFillIcon"),
);
const ShareForwardIcon = importRemixIcon(
  async () => import("remixicon-react/ShareForwardFillIcon"),
);
const Trash = importRemixIcon(
  async () => import("remixicon-react/DeleteBinLineIcon"),
);
const UpArrow = importRemixIcon(
  async () => import("remixicon-react/ArrowUpSFillIcon"),
);
const WarningIcon = importRemixIcon(
  async () => import("remixicon-react/ErrorWarningFillIcon"),
);
const WarningLineIcon = importRemixIcon(
  async () => import("remixicon-react/ErrorWarningLineIcon"),
);
const LoginIcon = importRemixIcon(
  async () => import("remixicon-react/LoginBoxLineIcon"),
);
const LogoutIcon = importRemixIcon(
  async () => import("remixicon-react/LogoutBoxRLineIcon"),
);
const ShareLineIcon = importRemixIcon(
  async () => import("remixicon-react/ShareLineIcon"),
);
const LoaderLineIcon = importRemixIcon(
  async () => import("remixicon-react/LoaderLineIcon"),
);
const WidgetIcon = importRemixIcon(
  async () => import("remixicon-react/FunctionLineIcon"),
);
const RefreshLineIcon = importRemixIcon(
  async () => import("remixicon-react/RefreshLineIcon"),
);
const GitBranchLineIcon = importRemixIcon(
  async () => import("remixicon-react/GitBranchLineIcon"),
);
const EditBoxLineIcon = importRemixIcon(
  async () => import("remixicon-react/EditBoxLineIcon"),
);
const StarLineIcon = importRemixIcon(
  async () => import("remixicon-react/StarLineIcon"),
);
const StarFillIcon = importRemixIcon(
  async () => import("remixicon-react/StarFillIcon"),
);
const Settings2LineIcon = importRemixIcon(
  async () => import("remixicon-react/Settings2LineIcon"),
);
const DownloadIcon = importRemixIcon(
  async () => import("remixicon-react/DownloadLineIcon"),
);
const UploadCloud2LineIcon = importRemixIcon(
  async () => import("remixicon-react/UploadCloud2LineIcon"),
);
const DownloadLineIcon = importRemixIcon(
  async () => import("remixicon-react/DownloadLineIcon"),
);
const UploadLineIcon = importRemixIcon(
  async () => import("remixicon-react/UploadLineIcon"),
);
const FileListLineIcon = importRemixIcon(
  async () => import("remixicon-react/FileListLineIcon"),
);
const HamburgerIcon = importRemixIcon(
  async () => import("remixicon-react/MenuLineIcon"),
);
const MagicLineIcon = importRemixIcon(
  async () => import("remixicon-react/MagicLineIcon"),
);
const UserHeartLineIcon = importRemixIcon(
  async () => import("remixicon-react/UserHeartLineIcon"),
);
const DvdLineIcon = importRemixIcon(
  async () => import("remixicon-react/DvdLineIcon"),
);
const Group2LineIcon = importRemixIcon(
  async () => import("remixicon-react/Group2LineIcon"),
);
const CodeViewIcon = importRemixIcon(
  async () => import("remixicon-react/CodeViewIcon"),
);
const GroupLineIcon = importRemixIcon(
  async () => import("remixicon-react/GroupLineIcon"),
);
const ArrowRightUpLineIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowRightUpLineIcon"),
);
const MailCheckLineIcon = importRemixIcon(
  async () => import("remixicon-react/MailCheckLineIcon"),
);
const UserFollowLineIcon = importRemixIcon(
  async () => import("remixicon-react/UserFollowLineIcon"),
);
const AddBoxLineIcon = importRemixIcon(
  async () => import("remixicon-react/AddBoxLineIcon"),
);
const ArrowRightSFillIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowRightSFillIcon"),
);
const ArrowDownSFillIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowDownSFillIcon"),
);
const MailLineIcon = importRemixIcon(
  async () => import("remixicon-react/MailLineIcon"),
);
const LockPasswordLineIcon = importRemixIcon(
  async () => import("remixicon-react/LockPasswordLineIcon"),
);
const Timer2LineIcon = importRemixIcon(
  async () => import("remixicon-react/Timer2LineIcon"),
);
const MapPin2LineIcon = importRemixIcon(
  async () => import("remixicon-react/MapPin2LineIcon"),
);
const User3LineIcon = importRemixIcon(
  async () => import("remixicon-react/User3LineIcon"),
);
const User2LineIcon = importRemixIcon(
  async () => import("remixicon-react/User2LineIcon"),
);
const Key2LineIcon = importRemixIcon(
  async () => import("remixicon-react/Key2LineIcon"),
);
const FileList2LineIcon = importRemixIcon(
  async () => import("remixicon-react/FileList2LineIcon"),
);
const Lock2LineIcon = importRemixIcon(
  async () => import("remixicon-react/Lock2LineIcon"),
);
const SearchEyeLineIcon = importRemixIcon(
  async () => import("remixicon-react/SearchEyeLineIcon"),
);
const AlertLineIcon = importRemixIcon(
  async () => import("remixicon-react/AlertLineIcon"),
);
const SettingsLineIcon = importRemixIcon(
  async () => import("remixicon-react/SettingsLineIcon"),
);
const LockUnlockLineIcon = importRemixIcon(
  async () => import("remixicon-react/LockUnlockLineIcon"),
);
const PantoneLineIcon = importRemixIcon(
  async () => import("remixicon-react/PantoneLineIcon"),
);
const QuestionFillIcon = importRemixIcon(
  async () => import("remixicon-react/QuestionFillIcon"),
);
const QuestionLineIcon = importRemixIcon(
  async () => import("remixicon-react/QuestionLineIcon"),
);
const UserSharedLineIcon = importRemixIcon(
  async () => import("remixicon-react/UserSharedLineIcon"),
);
const UserReceived2LineIcon = importRemixIcon(
  async () => import("remixicon-react/UserReceived2LineIcon"),
);
const UserAddLineIcon = importRemixIcon(
  async () => import("remixicon-react/UserAddLineIcon"),
);
const UserUnfollowLineIcon = importRemixIcon(
  async () => import("remixicon-react/UserUnfollowLineIcon"),
);
const DeleteRowIcon = importRemixIcon(
  async () => import("remixicon-react/DeleteRowIcon"),
);
const ArrowUpLineIcon = importRemixIcon(
  async () => import("remixicon-react/ArrowUpLineIcon"),
);
const MoneyDollarCircleLineIcon = importRemixIcon(
  async () => import("remixicon-react/MoneyDollarCircleLineIcon"),
);
const ExternalLinkLineIcon = importRemixIcon(
  async () => import("remixicon-react/ExternalLinkLineIcon"),
);

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
  [IconSize.XXS]: 8,
  [IconSize.XS]: 10,
  [IconSize.SMALL]: 12,
  [IconSize.MEDIUM]: 14,
  [IconSize.LARGE]: 15,
  [IconSize.XL]: 16,
  [IconSize.XXL]: 18,
  [IconSize.XXXL]: 20,
  [IconSize.XXXXL]: 22,
  undefined: 12,
};

export const sizeHandler = (size?: IconSize): number => {
  return (
    ICON_SIZE_LOOKUP[size as keyof typeof ICON_SIZE_LOOKUP] ||
    ICON_SIZE_LOOKUP[IconSize.SMALL]
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
  ${(props) =>
    props.withWrapper &&
    `
    min-width: ${sizeHandler(props.size) * 2}px;
    height: ${sizeHandler(props.size) * 2}px;
    border-radius: 9999px;
    justify-content: center;
    background-color: ${props.wrapperColor || "rgba(0, 0, 0, 0.1)"};
  `}
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
  "add-box-line": <AddBoxLineIcon />,
  "add-more": <AddMoreIcon />,
  "add-more-fill": <AddMoreFillIcon />,
  "alert-line": <AlertLineIcon />,
  "arrow-down-s-fill": <ArrowDownSFillIcon />,
  "arrow-forward": <ArrowForwardIcon />,
  "arrow-left": <ArrowLeft />,
  "arrow-right-s-fill": <ArrowRightSFillIcon />,
  "arrow-right-up-line": <ArrowRightUpLineIcon />,
  "arrow-up-line": <ArrowUpLineIcon />,
  "book-line": <BookLineIcon />,
  "bug-line": <BugLineIcon />,
  "cap-dot": <CapDotIcon />,
  "cap-solid": <CapSolidIcon />,
  "card-context-menu": <CardContextMenu />,
  "chat-help": <ChatIcon />,
  "check-line": <CheckLineIcon />,
  "chevron-left": <ChevronLeft />,
  "chevron-right": <ChevronRight />,
  "close-circle": <CloseCircleIcon />,
  "close-circle-line": <CloseCircleLineIcon />,
  "close-modal": <CloseLineIcon />,
  "close-x": <CloseLineIcon />,
  "cloud-off-line": <CloudOfflineIcon />,
  "comment-context-menu": <CommentContextMenu />,
  "compasses-line": <CompassesLine />,
  "context-menu": <ContextMenuIcon />,
  "database-2-line": <Database2Line />,
  "delete-blank": <DeleteBin7 />,
  "delete-row": <DeleteRowIcon />,
  "double-arrow-right": <DoubleArrowRightIcon />,
  "down-arrow": <DownArrowIcon />,
  "down-arrow-2": <ArrowDownLineIcon />,
  "download-line": <DownloadLineIcon />,
  "edit-box-line": <EditBoxLineIcon />,
  "edit-line": <EditLineIcon />,
  "edit-underline": <EditUnderlineIcon />,
  "expand-less": <ExpandLess />,
  "expand-more": <ExpandMore />,
  "external-link-line": <ExternalLinkLineIcon />,
  "eye-off": <EyeOff />,
  "eye-on": <EyeOn />,
  "file-line": <FileLine />,
  "file-list-2-line": <FileList2LineIcon />,
  "file-list-line": <FileListLineIcon />,
  "file-transfer": <FileTransfer />,
  "fork-2": <Fork2Icon />,
  "forbid-line": <ForbidLineIcon />,
  "git-branch": <GitBranchLineIcon />,
  "git-commit": <GitCommit />,
  "git-pull-request": <GitPullRequst />,
  "global-line": <GlobalLineIcon />,
  "group-2-line": <Group2LineIcon />,
  "group-line": <GroupLineIcon />,
  "invite-user": <InviteUserIcon />,
  "key-2-line": <Key2LineIcon />,
  "left-arrow-2": <LeftArrowIcon2 />,
  "lightbulb-flash-line": <LightbulbFlashLine />,
  "line-dashed": <LineDashedIcon />,
  "line-dotted": <LineDottedIcon />,
  "link-2": <Link2 />,
  "links-line": <LinksLineIcon />,
  "lock-2-line": <Lock2LineIcon />,
  "lock-password-line": <LockPasswordLineIcon />,
  "lock-unlock-line": <LockUnlockLineIcon />,
  "magic-line": <MagicLineIcon />,
  "mail-check-line": <MailCheckLineIcon />,
  "mail-line": <MailLineIcon />,
  "map-pin-2-line": <MapPin2LineIcon />,
  "more-2-fill": <More2FillIcon />,
  "news-paper": <NewsPaperLine />,
  "no-response": <NoResponseIcon />,
  "oval-check": <OvalCheck />,
  "oval-check-fill": <OvalCheckFill />,
  "pin-3": <Pin3 />,
  "play-circle-line": <PlayCircleLineIcon />,
  "question-fill": <QuestionFillIcon />,
  "question-line": <QuestionLineIcon />,
  "reaction-2": <Reaction2 />,
  "read-pin": <ReadPin />,
  "right-arrow": <RightArrowIcon />,
  "right-arrow-2": <RightArrowIcon2 />,
  "search-eye-line": <SearchEyeLineIcon />,
  "send-button": <SendButton />,
  "settings-2-line": <Settings2LineIcon />,
  "settings-line": <SettingsLineIcon />,
  "share-2": <ShareIcon2 />,
  "share-box": <ShareBoxFillIcon />,
  "share-box-line": <ShareBoxLineIcon />,
  "share-line": <ShareLineIcon />,
  "sort-asc": <SortAscIcon />,
  "sort-desc": <SortDescIcon />,
  "star-fill": <StarFillIcon />,
  "star-line": <StarLineIcon />,
  "swap-horizontal": <ArrowLeftRightIcon />,
  "timer-2-line": <Timer2LineIcon />,
  "trash-outline": <TrashOutline />,
  "trending-flat": <TrendingFlat />,
  "unread-pin": <UnreadPin />,
  "upload-cloud": <UploadCloud2LineIcon />,
  "upload-line": <UploadLineIcon />,
  "user-2": <UserV2Icon />,
  "user-2-line": <User2LineIcon />,
  "user-3-line": <User3LineIcon />,
  "user-add-line": <UserAddLineIcon />,
  "user-follow-line": <UserFollowLineIcon />,
  "user-heart-line": <UserHeartLineIcon />,
  "user-received-2-line": <UserReceived2LineIcon />,
  "user-shared-line": <UserSharedLineIcon />,
  "user-unfollow-line": <UserUnfollowLineIcon />,
  "view-all": <RightArrowIcon />,
  "view-less": <LeftArrowIcon />,
  "warning-line": <WarningLineIcon />,
  "warning-triangle": <WarningTriangleIcon />,
  "money-dollar-circle-line": <MoneyDollarCircleLineIcon />,
  "success-line": <SuccessLineIcon />,
  "error-line": <ErrorLineIcon />,
  "history-line": <HistoryLineIcon />,
  billing: <BillingIcon />,
  book: <BookIcon />,
  bug: <BugIcon />,
  cancel: <CancelIcon />,
  chat: <Chat />,
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
  download2: <DownloadIcon />,
  download: <Download />,
  dropdown: <DropdownIcon />,
  duplicate: <DuplicateIcon />,
  edit: <EditIcon />,
  emoji: <Emoji />,
  enterprise: <MagicLineIcon />,
  error: <ErrorIcon />,
  execute: <ExecuteIcon />,
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
  login: <LoginIcon />,
  logout: <LogoutIcon />,
  manage: <ManageIcon />,
  member: <UserHeartLineIcon />,
  minus: <RemoveIcon />,
  mobile: <MobileIcon />,
  open: <OpenIcon />,
  pantone: <PantoneLineIcon />,
  pin: <Pin />,
  play: <PlayIcon />,
  plus: <CreateNewIcon />,
  query: <QueryIcon />,
  reaction: <Reaction />,
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
  tabletLandscape: <TabletLandscapeIcon />,
  trash: <Trash />,
  unpin: <Unpin />,
  upArrow: <UpArrow />,
  upgrade: <DvdLineIcon />,
  upload: <Upload />,
  user: <UserIcon />,
  wand: <WandIcon />,
  warning: <WarningIcon />,
  widget: <WidgetIcon />,
  workspace: <WorkspaceIcon />,
  "clear-interval": <ClearInterval />,
  "clear-store": <ClearStore />,
  "copy-to-clipboard": <CopyToClipboard />,
  "download-action": <DownloadAction />,
  "execute-js": <ExecuteJs />,
  "execute-query": <ExecuteQuery />,
  "get-geolocation": <GetGeolocation />,
  modal: <Modal />,
  "navigate-to": <NavigateTo />,
  "remove-store": <RemoveStore />,
  "reset-widget": <ResetWidget />,
  "set-interval": <SetInterval />,
  "show-alert": <ShowAlert />,
  "stop-watch-geolocation": <StopWatchGeolocation />,
  "store-value": <StoreValue />,
  "watch-geolocation": <WatchGeolocation />,
  "run-api": <RunAPI />,
  "post-message": <PostMessage />,
  "no-action": <NoAction />,
  package: <PackageIcon />,
  devices: <DevicesIcon />,
  grid: <GridIcon />,
};

export const IconCollection = Object.keys(ICON_LOOKUP);

export type IconName = (typeof IconCollection)[number];

export interface IconProps {
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
  withWrapper?: boolean;
  wrapperColor?: string;
}

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

export default React.memo(Icon);

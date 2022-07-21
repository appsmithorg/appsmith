import React, { useEffect, useMemo, useState } from "react";
import TextInput from "components/ads/TextInput";
import styled, { useTheme } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";

import {
  createNewBranchInit,
  fetchBranchesInit,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import {
  getCurrentGitBranch,
  getDefaultGitBranchName,
  getFetchingBranches,
  getGitBranches,
  getGitBranchNames,
} from "selectors/gitSyncSelectors";

import Skeleton from "components/utils/Skeleton";

import scrollIntoView from "scroll-into-view-if-needed";

import BranchListHotkeys from "./BranchListHotkeys";
import {
  createMessage,
  FIND_OR_CREATE_A_BRANCH,
  SWITCH_BRANCHES,
  SYNC_BRANCHES,
} from "@appsmith/constants/messages";
import { Space } from "./StyledComponents";
import Icon, { IconSize, IconWrapper } from "components/ads/Icon";
import { get } from "lodash";
import { TooltipComponent as Tooltip } from "design-system";
import Spinner from "components/ads/Spinner";
import {
  isLocalBranch,
  isRemoteBranch,
  removeSpecialChars,
} from "pages/Editor/gitSync/utils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useActiveHoverIndex, useFilteredBranches } from "../hooks";
import { BranchListItemContainer } from "./BranchListItemContainer";
import { RemoteBranchList } from "./RemoteBranchList";
import { LocalBranchList } from "./LocalBranchList";

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: 300px;
  position: relative;
`;

const BranchDropdownContainer = styled.div`
  height: 40vh;
  display: flex;
  flex-direction: column;

  & .title {
    ${(props) => getTypographyByKey(props, "p1")};
  }

  padding: ${(props) => props.theme.spaces[5]}px;
  min-height: 0;
`;

// used for skeletons
const textInputHeight = 38;
const textHeight = 18;

const CreateNewBranchContainer = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  & ${IconWrapper} {
    display: inline;
  }

  & div {
    margin-left: ${(props) => props.theme.spaces[4]}px;
    display: block;
    word-break: break-all;
  }

  & .large-text {
    ${(props) => getTypographyByKey(props, "p1")};
    color: ${Colors.BLACK};
  }

  & .small-text {
    ${(props) => getTypographyByKey(props, "p3")};
    color: ${Colors.GREY_7};
  }
`;

const SpinnerContainer = styled.div`
  align-self: center;
  width: 12px;
  position: absolute;
  right: 16px;
`;

function CreateNewBranch({
  branch,
  className,
  currentBranch,
  hovered,
  isCreatingNewBranch,
  onClick,
  shouldScrollIntoView,
}: any) {
  useEffect(() => {
    if (itemRef.current && shouldScrollIntoView)
      scrollIntoView(itemRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      });
  }, [shouldScrollIntoView]);
  const itemRef = React.useRef<HTMLDivElement>(null);
  const theme = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        alignItems: "flex-start",
        cursor: isCreatingNewBranch ? "not-allowed" : "pointer",
        display: "flex",
        background: hovered ? Colors.GREY_3 : "unset",
        padding: get(theme, "spaces[5]"),
      }}
    >
      <Icon
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        name="git-branch"
        size={IconSize.XXXL}
      />
      <CreateNewBranchContainer className={className} ref={itemRef}>
        <div className="large-text">{`Create branch: ${branch} `}</div>
        <div className="small-text">{`from '${currentBranch}'`}</div>
      </CreateNewBranchContainer>
      <SpinnerContainer>{isCreatingNewBranch && <Spinner />}</SpinnerContainer>
    </div>
  );
}

export function LoadingRow() {
  return (
    <BranchListItemContainer>
      <div style={{ height: textHeight, width: "100%" }}>
        <Skeleton />
      </div>
    </BranchListItemContainer>
  );
}

export function BranchesLoading() {
  return (
    <>
      <LoadingRow />
      <LoadingRow />
      <LoadingRow />
    </>
  );
}

export function Header({
  closePopup,
  fetchBranches,
}: {
  closePopup: () => void;
  fetchBranches: () => void;
}) {
  const title = createMessage(SWITCH_BRANCHES);
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span className="title">{title}</span>
        <span
          style={{
            display: "inline-block",
            marginLeft: get(theme, "spaces[1]"),
          }}
        >
          <Tooltip
            content={createMessage(SYNC_BRANCHES)}
            hoverOpenDelay={10}
            modifiers={{
              flip: { enabled: false },
            }}
            position="top"
          >
            <Icon
              className="t--sync-branches"
              fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
              hoverFillColor={Colors.BLACK}
              name="refresh"
              onClick={fetchBranches}
              size={IconSize.XXXL}
            />
          </Tooltip>
        </span>
      </div>
      <Icon
        className="t--close-branch-list"
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        hoverFillColor={Colors.BLACK}
        name="close-modal"
        onClick={closePopup}
        size={IconSize.XXXXL}
      />
    </div>
  );
}

export default function BranchList(props: {
  setIsPopupOpen?: (flag: boolean) => void;
}) {
  const dispatch = useDispatch();
  const pruneAndFetchBranches = () => {
    AnalyticsUtil.logEvent("GS_SYNC_BRANCHES", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    dispatch(fetchBranchesInit({ pruneBranches: true }));
  };

  const branches = useSelector(getGitBranches);
  const branchNames = useSelector(getGitBranchNames);
  const currentBranch = useSelector(getCurrentGitBranch);
  const fetchingBranches = useSelector(getFetchingBranches);
  const defaultBranch = useSelector(getDefaultGitBranchName);

  const [searchText, changeSearchTextInState] = useState("");
  const changeSearchText = (text: string) => {
    changeSearchTextInState(removeSpecialChars(text));
  };

  const isCreateNewBranchInputValid = useMemo(
    () =>
      !!(
        searchText &&
        branchNames &&
        !branchNames.find((branch: string) => branch === searchText)
      ),
    [searchText, branchNames],
  );

  const filteredBranches = useFilteredBranches(branches, searchText);

  const localBranches = filteredBranches.filter((b: string) =>
    isLocalBranch(b),
  );
  const remoteBranches = filteredBranches.filter((b: string) =>
    isRemoteBranch(b),
  );
  const { activeHoverIndex, setActiveHoverIndex } = useActiveHoverIndex(
    currentBranch,
    filteredBranches,
    isCreateNewBranchInputValid,
  );

  const [isCreatingNewBranch, setIsCreatingNewBranch] = useState(false);

  const handleCreateNewBranch = () => {
    if (isCreatingNewBranch) return;
    AnalyticsUtil.logEvent("GS_CREATE_NEW_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    const branch = searchText;
    setIsCreatingNewBranch(true);
    dispatch(
      createNewBranchInit({
        branch,
        onErrorCallback: () => {
          setIsCreatingNewBranch(false);
        },
        onSuccessCallback: () => {
          setIsCreatingNewBranch(false);
          if (typeof props.setIsPopupOpen === "function")
            props.setIsPopupOpen(false);
        },
      }),
    );
  };

  const switchBranch = (branch: string): void => {
    AnalyticsUtil.logEvent("GS_SWITCH_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    dispatch(switchGitBranchInit(branch));
  };

  const handleUpKey = () => setActiveHoverIndex(activeHoverIndex - 1);

  const handleDownKey = () => setActiveHoverIndex(activeHoverIndex + 1);

  const handleSubmitKey = () => {
    if (isCreateNewBranchInputValid) {
      handleCreateNewBranch();
    } else {
      switchBranch(filteredBranches[activeHoverIndex]);
    }
  };

  const handleEscKey = () => {
    if (typeof props.setIsPopupOpen === "function") props.setIsPopupOpen(false);
  };

  const remoteBranchList = RemoteBranchList(remoteBranches, switchBranch);
  const localBranchList = LocalBranchList(
    localBranches,
    currentBranch,
    isCreateNewBranchInputValid,
    activeHoverIndex,
    defaultBranch,
    switchBranch,
  );
  return (
    <BranchListHotkeys
      handleDownKey={handleDownKey}
      handleEscKey={handleEscKey}
      handleSubmitKey={handleSubmitKey}
      handleUpKey={handleUpKey}
    >
      <BranchDropdownContainer>
        <Header
          closePopup={() => {
            if (typeof props.setIsPopupOpen === "function") {
              props.setIsPopupOpen(false);
            }
          }}
          fetchBranches={pruneAndFetchBranches}
        />
        <Space size={4} />
        <div style={{ width: 300 }}>
          {fetchingBranches && (
            <div style={{ width: "100%", height: textInputHeight }}>
              <Skeleton />
            </div>
          )}
          {!fetchingBranches && (
            <TextInput
              autoFocus
              className="branch-search t--branch-search-input"
              fill
              onChange={changeSearchText}
              placeholder={createMessage(FIND_OR_CREATE_A_BRANCH)}
              value={searchText}
            />
          )}
        </div>
        {fetchingBranches && <BranchesLoading />}
        {!fetchingBranches && (
          <ListContainer>
            {isCreateNewBranchInputValid && (
              <CreateNewBranch
                branch={searchText}
                className="t--create-new-branch-button"
                currentBranch={currentBranch}
                hovered={activeHoverIndex === 0}
                isCreatingNewBranch={isCreatingNewBranch}
                onClick={handleCreateNewBranch}
                shouldScrollIntoView={activeHoverIndex === 0}
              />
            )}
            {localBranchList}
            {remoteBranchList}
          </ListContainer>
        )}
      </BranchDropdownContainer>
    </BranchListHotkeys>
  );
}

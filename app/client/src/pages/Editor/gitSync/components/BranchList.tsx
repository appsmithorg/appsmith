import React, { useEffect, useMemo, useState } from "react";
import { getTypographyByKey } from "design-system-old";
import styled, { useTheme } from "styled-components";
import { useDispatch, useSelector } from "react-redux";

import {
  createNewBranchInit,
  fetchBranchesInit,
  // setIsGitSyncModalOpen,
  switchGitBranchInit,
} from "actions/gitSyncActions";
import {
  getCurrentGitBranch,
  getDefaultGitBranchName,
  getFetchingBranches,
  getGitBranches,
  getGitBranchNames,
  getProtectedBranchesSelector,
} from "selectors/gitSyncSelectors";

import Skeleton from "components/utils/Skeleton";

import scrollIntoView from "scroll-into-view-if-needed";

import BranchListHotkeys from "./BranchListHotkeys";
import {
  createMessage,
  FIND_OR_CREATE_A_BRANCH,
  // GO_TO_SETTINGS,
  // LEARN_MORE,
  // NOW_PROTECT_BRANCH,
  SWITCH_BRANCHES,
  SYNC_BRANCHES,
} from "@appsmith/constants/messages";
import {
  Icon,
  Spinner,
  Tooltip,
  Button,
  SearchInput,
  Text,
  // Callout,
} from "design-system";
import { get } from "lodash";
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
import type { Theme } from "constants/DefaultTheme";
import { Space } from "./StyledComponents";
// import { GitSyncModalTab } from "entities/GitSync";

const ListContainer = styled.div`
  flex: 1;
  overflow: auto;
  width: calc(300px + 5px);
  margin-right: -5px;
  position: relative;
`;

const BranchDropdownContainer = styled.div`
  height: 45vh;
  display: flex;
  flex-direction: column;

  // & .title {
  //   ${getTypographyByKey("h3")};
  //   color: var(--ads-v2-color-fg-emphasis-plus);
  // }

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
  margin-right: 4px;

  & div {
    margin-left: ${(props) => props.theme.spaces[4]}px;
    display: block;
    word-break: break-all;
  }

  & .large-text {
    ${getTypographyByKey("p1")};
    color: var(--ads-v2-color-fg);
  }

  & .small-text {
    ${getTypographyByKey("p3")};
    color: var(--ads-v2-color-fg-muted);
  }
`;

const SpinnerContainer = styled.div<{ isCreatingNewBranch: boolean }>`
  align-self: center;
  width: 12px;
  visibility: ${(props) => (props.isCreatingNewBranch ? "visible" : "hidden")};
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
  const theme = useTheme() as Theme;

  return (
    <div
      onClick={onClick}
      style={{
        alignItems: "flex-start",
        cursor: isCreatingNewBranch ? "not-allowed" : "pointer",
        display: "flex",
        justifyContent: "space-between",
        background: hovered ? "var(--ads-v2-color-bg-muted)" : "unset",
        padding: get(theme, "spaces[5]"),
        borderRadius: "var(--ads-v2-border-radius)",
      }}
    >
      <div className="flex">
        <Icon
          color={get(theme, "colors.gitSyncModal.closeIcon")}
          name="git-branch"
          size="lg"
        />
        <CreateNewBranchContainer className={className} ref={itemRef}>
          <div className="large-text">{`Create branch: ${branch} `}</div>
          <div className="small-text">{`from '${currentBranch}'`}</div>
        </CreateNewBranchContainer>
      </div>

      <SpinnerContainer isCreatingNewBranch={isCreatingNewBranch}>
        <Spinner data-testid={"t--branch-creating-spinner"} size="sm" />
      </SpinnerContainer>
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
  const theme = useTheme() as Theme;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Text color={"var(--ads-v2-color-fg-emphasis-plus)"} kind="heading-s">
          {title}
        </Text>
        <span
          style={{
            display: "inline-block",
            marginLeft: get(theme, "spaces[1]"),
          }}
        >
          <Tooltip content={createMessage(SYNC_BRANCHES)} placement="top">
            <Button
              className="t--sync-branches"
              color={get(theme, "colors.gitSyncModal.closeIcon")}
              isIconButton
              kind="tertiary"
              onClick={fetchBranches}
              size="md"
              startIcon="refresh"
            />
          </Tooltip>
        </span>
      </div>
      <Button
        className="t--close-branch-list"
        color={get(theme, "colors.gitSyncModal.closeIcon")}
        isIconButton
        kind="tertiary"
        onClick={closePopup}
        size="md"
        startIcon="close-modal"
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
  const protectedBranches = useSelector(getProtectedBranchesSelector);
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
    protectedBranches,
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
        <Space size={3} />
        <div style={{ width: 300 }}>
          {fetchingBranches && (
            <div style={{ width: "100%", height: textInputHeight }}>
              <Skeleton />
            </div>
          )}
          {!fetchingBranches && (
            <SearchInput
              autoFocus
              className="branch-search t--branch-search-input"
              fill
              onChange={changeSearchText}
              placeholder={createMessage(FIND_OR_CREATE_A_BRANCH)}
              value={searchText}
            />
          )}
        </div>
        <Space size={3} />

        {fetchingBranches && <BranchesLoading />}
        {!fetchingBranches && (
          <ListContainer>
            {/* keeping it commented for future use */}
            {/* <Callout
              isClosable
              links={[
                {
                  children: createMessage(GO_TO_SETTINGS),
                  onClick: () => {
                    props.setIsPopupOpen?.(false);
                    dispatch(
                      setIsGitSyncModalOpen({
                        isOpen: true,
                        tab: GitSyncModalTab.SETTINGS,
                      }),
                    );
                  },
                },
                {
                  children: createMessage(LEARN_MORE),
                  to: "https://docs.appsmith.com/advanced-concepts/version-control-with-git",
                  target: "_blank",
                },
              ]}
              style={{ width: 300 }}
            >
              {createMessage(NOW_PROTECT_BRANCH)}
            </Callout> */}
            <Space size={5} />
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
            <Space size={5} />
            {remoteBranchList}
          </ListContainer>
        )}
      </BranchDropdownContainer>
    </BranchListHotkeys>
  );
}

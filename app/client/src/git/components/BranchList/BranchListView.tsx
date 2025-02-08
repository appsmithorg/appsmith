import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getTypographyByKey } from "@appsmith/ads-old";
import styled, { useTheme } from "styled-components";
import Skeleton from "components/utils/Skeleton";
import scrollIntoView from "scroll-into-view-if-needed";
import BranchListHotkeys from "./BranchListHotKeys";
import {
  createMessage,
  FIND_OR_CREATE_A_BRANCH,
  SWITCH_BRANCHES,
  SYNC_BRANCHES,
} from "ee/constants/messages";
import {
  Icon,
  Spinner,
  Tooltip,
  Button,
  SearchInput,
  Text,
} from "@appsmith/ads";
import get from "lodash/get";
import noop from "lodash/noop";
import {
  isLocalBranch,
  isRemoteBranch,
  removeSpecialChars,
} from "pages/Editor/gitSync/utils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import RemoteBranchList from "./RemoteBranchList";
import type { Theme } from "constants/DefaultTheme";
import BranchListItemContainer from "./BranchListItemContainer";
import LocalBranchList from "./LocalBranchList";
import { useFilteredBranches } from "./hooks/useFilteredBranches";
import useActiveHoverIndex from "./hooks/useActiveHoverIndex";
import { Space } from "pages/Editor/gitSync/components/StyledComponents";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import type { GitBranch } from "git/types";

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

const SpinnerContainer = styled.div<{ isCreateBranchLoading: boolean }>`
  align-self: center;
  width: 12px;
  visibility: ${(props) =>
    props.isCreateBranchLoading ? "visible" : "hidden"};
`;

interface CreateNewBranchProps {
  branch: string;
  className: string;
  currentBranch: string | null;
  hovered: boolean;
  isCreateBranchLoading: boolean;
  onClick: () => void;
  shouldScrollIntoView: boolean;
}

function CreateNewBranch({
  branch,
  className,
  currentBranch,
  hovered,
  isCreateBranchLoading,
  onClick,
  shouldScrollIntoView,
}: CreateNewBranchProps) {
  useEffect(
    function onInitEffect() {
      if (itemRef.current && shouldScrollIntoView)
        scrollIntoView(itemRef.current, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        });
    },
    [shouldScrollIntoView],
  );
  const itemRef = React.useRef<HTMLDivElement>(null);
  const theme = useTheme() as Theme;

  return (
    <div
      onClick={onClick}
      style={{
        alignItems: "flex-start",
        cursor: isCreateBranchLoading ? "not-allowed" : "pointer",
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

      <SpinnerContainer isCreateBranchLoading={isCreateBranchLoading}>
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

interface BranchListHeaderProps {
  onClickClose: () => void;
  onClickRefresh: () => void;
}

export function Header({
  onClickClose = noop,
  onClickRefresh = noop,
}: BranchListHeaderProps) {
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
              color={get(theme, "colors.gitSyncModal.closeIcon")}
              data-testid="t--git-branch-sync"
              isIconButton
              kind="tertiary"
              onClick={onClickRefresh}
              size="md"
              startIcon="refresh"
            />
          </Tooltip>
        </span>
      </div>
      <Button
        color={get(theme, "colors.gitSyncModal.closeIcon")}
        data-testid="t--git-branch-close"
        isIconButton
        kind="tertiary"
        onClick={onClickClose}
        size="md"
        startIcon="close-modal"
      />
    </div>
  );
}

interface BranchListViewProps {
  branches: GitBranch[] | null;
  checkoutBranch: (branch: string) => void;
  checkoutDestBranch: string | null;
  createBranch: (branch: string) => void;
  currentBranch: string | null;
  defaultBranch: string | null;
  deleteBranch: (branch: string) => void;
  fetchBranches: () => void;
  fetchProtectedBranches: () => void;
  isCreateBranchLoading: boolean;
  isCheckoutBranchLoading: boolean;
  isFetchBranchesLoading: boolean;
  isFetchProtectedBranchesLoading: boolean;
  protectedBranches: FetchProtectedBranchesResponseData | null;
  toggleBranchPopup: (isOpen: boolean) => void;
}

export default function BranchListView({
  branches = null,
  checkoutBranch = noop,
  checkoutDestBranch = null,
  createBranch = noop,
  currentBranch = null,
  defaultBranch = null,
  deleteBranch = noop,
  fetchBranches = noop,
  fetchProtectedBranches = noop,
  isCheckoutBranchLoading = false,
  isCreateBranchLoading = false,
  isFetchBranchesLoading = false,
  isFetchProtectedBranchesLoading = false,
  protectedBranches = null,
  toggleBranchPopup = noop,
}: BranchListViewProps) {
  const [searchText, changeSearchTextInState] = useState("");
  const changeSearchText = useCallback((text: string) => {
    changeSearchTextInState(removeSpecialChars(text));
  }, []);
  const branchNames = useMemo(
    () => branches?.map((branch) => branch.branchName),
    [branches],
  );

  const isCreateNewBranchInputValid = useMemo(
    () =>
      !!(
        searchText &&
        branchNames &&
        !branchNames.find((branch: string) => branch === searchText)
      ),
    [searchText, branchNames],
  );

  const filteredBranches = useFilteredBranches(branches ?? [], searchText);

  const localBranches = filteredBranches.filter((b: string) =>
    isLocalBranch(b),
  );
  const remoteBranches = filteredBranches.filter((b: string) =>
    isRemoteBranch(b),
  );
  const { activeHoverIndex, setActiveHoverIndex } = useActiveHoverIndex(
    currentBranch ?? "",
    filteredBranches,
    isCreateNewBranchInputValid,
  );

  const handleClickOnRefresh = useCallback(() => {
    AnalyticsUtil.logEvent("GS_SYNC_BRANCHES", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    fetchBranches();
    fetchProtectedBranches();
  }, [fetchBranches, fetchProtectedBranches]);

  const handleCreateNewBranch = useCallback(() => {
    if (isCreateBranchLoading) return;

    AnalyticsUtil.logEvent("GS_CREATE_NEW_BRANCH", {
      source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
    });
    const branch = searchText;

    createBranch(branch);
  }, [createBranch, isCreateBranchLoading, searchText]);

  const handleUpKey = useCallback(
    () => setActiveHoverIndex(activeHoverIndex - 1),
    [activeHoverIndex, setActiveHoverIndex],
  );

  const handleDownKey = useCallback(
    () => setActiveHoverIndex(activeHoverIndex + 1),
    [activeHoverIndex, setActiveHoverIndex],
  );

  const handleSubmitKey = useCallback(() => {
    if (isCreateNewBranchInputValid) {
      handleCreateNewBranch();
    } else {
      checkoutBranch(filteredBranches[activeHoverIndex]);
      AnalyticsUtil.logEvent("GS_SWITCH_BRANCH", {
        source: "BRANCH_LIST_POPUP_FROM_BOTTOM_BAR",
      });
    }
  }, [
    activeHoverIndex,
    filteredBranches,
    handleCreateNewBranch,
    isCreateNewBranchInputValid,
    checkoutBranch,
  ]);

  const handleEscKey = useCallback(() => {
    toggleBranchPopup(false);
  }, [toggleBranchPopup]);

  const handleClickOnClose = useCallback(() => {
    toggleBranchPopup(false);
  }, [toggleBranchPopup]);

  const isLoading = isFetchBranchesLoading || isFetchProtectedBranchesLoading;

  return (
    <BranchListHotkeys
      handleDownKey={handleDownKey}
      handleEscKey={handleEscKey}
      handleSubmitKey={handleSubmitKey}
      handleUpKey={handleUpKey}
    >
      <BranchDropdownContainer>
        <Header
          onClickClose={handleClickOnClose}
          onClickRefresh={handleClickOnRefresh}
        />
        <Space size={3} />
        <div data-testid="t--git-branch-search-input" style={{ width: 300 }}>
          {isLoading && (
            <div style={{ width: "100%", height: textInputHeight }}>
              <Skeleton />
            </div>
          )}
          {!isLoading && (
            <SearchInput
              autoFocus
              // @ts-expect-error Needs to be fixed in ads
              fill
              onChange={changeSearchText}
              placeholder={createMessage(FIND_OR_CREATE_A_BRANCH)}
              value={searchText}
            />
          )}
        </div>
        <Space size={3} />

        {isLoading && <BranchesLoading />}
        {!isLoading && (
          <ListContainer>
            <Space size={5} />
            {isCreateNewBranchInputValid && (
              <CreateNewBranch
                branch={searchText}
                className="t--create-new-branch-button"
                currentBranch={currentBranch}
                hovered={activeHoverIndex === 0}
                isCreateBranchLoading={isCreateBranchLoading}
                onClick={handleCreateNewBranch}
                shouldScrollIntoView={activeHoverIndex === 0}
              />
            )}
            <LocalBranchList
              activeHoverIndex={activeHoverIndex}
              checkoutBranch={checkoutBranch}
              checkoutDestBranch={checkoutDestBranch}
              currentBranch={currentBranch}
              defaultBranch={defaultBranch}
              deleteBranch={deleteBranch}
              isCheckoutBranchLoading={isCheckoutBranchLoading}
              isCreateNewBranchInputValid={isCreateNewBranchInputValid}
              localBranches={localBranches}
              protectedBranches={protectedBranches}
            />
            <Space size={5} />
            <RemoteBranchList
              checkoutBranch={checkoutBranch}
              checkoutDestBranch={checkoutDestBranch}
              isCheckoutBranchLoading={isCheckoutBranchLoading}
              remoteBranches={remoteBranches}
            />
          </ListContainer>
        )}
      </BranchDropdownContainer>
    </BranchListHotkeys>
  );
}

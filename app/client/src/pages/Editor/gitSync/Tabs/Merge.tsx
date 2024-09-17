import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Space } from "../components/StyledComponents";

import {
  BRANCH_PROTECTION_PROTECTED,
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  createMessage,
  FETCH_GIT_STATUS,
  FETCH_MERGE_STATUS,
  IS_MERGING,
  MERGE_CHANGES,
  MERGED_SUCCESSFULLY,
  SELECT_BRANCH_TO_MERGE,
} from "ee/constants/messages";

import styled, { useTheme } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentAppGitMetaData } from "ee/selectors/applicationSelectors";
import {
  getConflictFoundDocUrlMerge,
  getFetchingBranches,
  getGitBranches,
  getGitStatus,
  getIsFetchingGitStatus,
  getIsFetchingMergeStatus,
  getIsMergeInProgress,
  getMergeError,
  getMergeStatus,
  getProtectedBranchesSelector,
} from "selectors/gitSyncSelectors";
import type { DropdownOptions } from "../../GeneratePage/components/constants";
import {
  fetchBranchesInit,
  fetchMergeStatusInit,
  mergeBranchInit,
  resetMergeStatus,
} from "actions/gitSyncActions";
import MergeStatus, { MERGE_STATUS_STATE } from "../components/MergeStatus";
import ConflictInfo from "../components/ConflictInfo";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import { getIsStartingWithRemoteBranches } from "pages/Editor/gitSync/utils";
import { Classes } from "../constants";
import SuccessTick from "pages/common/SuccessTick";
import {
  Button,
  Option,
  Select,
  Text,
  Icon,
  ModalFooter,
  ModalBody,
} from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Theme } from "constants/DefaultTheme";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

function MergeSuccessIndicator() {
  const theme = useTheme() as Theme;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <SuccessTick height="36px" style={{ marginBottom: 0 }} width="30px" />
      <Text
        color={"var(--ads-v2-color-fg)"}
        kind="heading-s"
        style={{ marginLeft: theme.spaces[2] }}
      >
        {createMessage(MERGED_SUCCESSFULLY)}
      </Text>
    </div>
  );
}

export default function Merge() {
  const dispatch = useDispatch();
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitBranches = useSelector(getGitBranches);
  const isFetchingBranches = useSelector(getFetchingBranches);
  const isFetchingMergeStatus = useSelector(getIsFetchingMergeStatus);
  const mergeStatus = useSelector(getMergeStatus);
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gitStatus: any = useSelector(getGitStatus);
  const mergeError = useSelector(getMergeError);
  const isMergeAble = mergeStatus?.isMergeAble && gitStatus?.isClean;
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const protectedBranches = useSelector(getProtectedBranchesSelector);
  let mergeStatusMessage = !gitStatus?.isClean
    ? createMessage(CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES)
    : mergeStatus?.message;
  // const pullFailed: any = useSelector(getPullFailed);
  const currentBranch = gitMetaData?.branchName;
  const isMerging = useSelector(getIsMergeInProgress);
  const [showMergeSuccessIndicator, setShowMergeSuccessIndicator] =
    useState(false);

  const [selectedBranchOption, setSelectedBranchOption] = useState<{
    label: string;
    value: string;
  }>();

  /**
   * Removes the current branch from the list
   * Also filters the remote branches
   */
  const branchList = useMemo(() => {
    const branchOptions: DropdownOptions = [];
    let index = 0;
    while (true) {
      if (index === gitBranches.length) break;
      const branchObj = gitBranches[index];

      if (currentBranch !== branchObj.branchName) {
        if (!branchObj.default) {
          branchOptions.push({
            label: branchObj.branchName,
            value: branchObj.branchName,
          });
        } else {
          branchOptions.unshift({
            label: branchObj.branchName,
            value: branchObj.branchName,
          });
        }
      }

      const nextBranchObj = gitBranches[index + 1];
      if (
        getIsStartingWithRemoteBranches(
          branchObj.branchName,
          nextBranchObj?.branchName,
        )
      )
        break;

      index++;
    }
    // TODO add bellow header if dropdown supports section header
    // branchOptions.unshift({
    //   label: "Local branches",
    //   isSectionHeader: true,
    // });
    return branchOptions;
  }, [gitBranches]);

  const currentBranchDropdownOption = {
    label: currentBranch || "",
    value: currentBranch || "",
  };

  const handleMergeSuccess = () => {
    setShowMergeSuccessIndicator(true);
  };

  const mergeHandler = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_CHANGES_BUTTON_CLICK", {
      source: "GIT_MERGE_MODAL",
    });
    if (currentBranch && selectedBranchOption?.value) {
      dispatch(
        mergeBranchInit({
          payload: {
            sourceBranch: currentBranch,
            destinationBranch: selectedBranchOption?.value,
          },
          onSuccessCallback: handleMergeSuccess,
        }),
      );
    }
  }, [currentBranch, selectedBranchOption?.value, dispatch]);

  useEffect(() => {
    dispatch(fetchBranchesInit());
    return () => {
      dispatch(resetMergeStatus());
    };
  }, []);

  useEffect(() => {
    // when user selects a branch to merge
    if (currentBranch && selectedBranchOption?.value) {
      dispatch(
        fetchMergeStatusInit({
          sourceBranch: currentBranch,
          destinationBranch: selectedBranchOption?.value,
        }),
      );
      setShowMergeSuccessIndicator(false);
    }
  }, [currentBranch, selectedBranchOption?.value, dispatch]);

  const mergeBtnDisabled = isFetchingMergeStatus || !isMergeAble;

  let status = MERGE_STATUS_STATE.NONE;
  if (isFetchingGitStatus) {
    status = MERGE_STATUS_STATE.FETCHING;
    mergeStatusMessage = createMessage(FETCH_GIT_STATUS);
  } else if (!gitStatus?.isClean) {
    status = MERGE_STATUS_STATE.NOT_MERGEABLE;
  } else if (isFetchingMergeStatus) {
    status = MERGE_STATUS_STATE.FETCHING;
    mergeStatusMessage = createMessage(FETCH_MERGE_STATUS);
  } else if (mergeStatus && mergeStatus?.isMergeAble) {
    status = MERGE_STATUS_STATE.MERGEABLE;
  } else if (mergeStatus && !mergeStatus?.isMergeAble) {
    status = MERGE_STATUS_STATE.NOT_MERGEABLE;
  } else if (mergeError) {
    status = MERGE_STATUS_STATE.ERROR;
    mergeStatusMessage = mergeError.error.message;
  }

  // should check after added error code for conflicting
  const isConflicting = (mergeStatus?.conflictingFiles?.length || 0) > 0;
  const showMergeButton =
    !isConflicting && !mergeError && !isFetchingGitStatus && !isMerging;
  const gitConflictDocumentUrl = useSelector(getConflictFoundDocUrlMerge);
  return (
    <>
      <ModalBody>
        <Container
          style={{ minHeight: 360, overflow: "unset", paddingBottom: "4px" }}
        >
          <Text color={"var(--ads-v2-color-fg-emphasis)"} kind="heading-s">
            {createMessage(SELECT_BRANCH_TO_MERGE)}
          </Text>
          <Space size={2} />
          <Row style={{ overflow: "unset", paddingBottom: "4px" }}>
            <Select
              data-testid="t--merge-branch-dropdown-destination"
              dropdownClassName={Classes.MERGE_DROPDOWN}
              dropdownMatchSelectWidth
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              isDisabled={
                isFetchingBranches || isFetchingMergeStatus || isMerging
              }
              isValid={status !== MERGE_STATUS_STATE.NOT_MERGEABLE}
              onSelect={(value?: string) => {
                if (value)
                  setSelectedBranchOption({ label: value, value: value });
              }}
              showSearch
              size="md"
              value={selectedBranchOption}
            >
              {branchList.map((branch) => {
                const isProtected = protectedBranches.includes(
                  branch?.value ?? "",
                );
                return (
                  <Option disabled={isProtected} key={branch.value}>
                    {branch.value}
                    {isProtected
                      ? ` (${createMessage(BRANCH_PROTECTION_PROTECTED)})`
                      : ""}
                  </Option>
                );
              })}
            </Select>

            <Space horizontal size={3} />
            <Icon
              color={"var(--ads-v2-color-fg-subtle)"}
              name="arrow-left-s-line"
              size="lg"
            />
            <Space horizontal size={3} />
            <Select
              className="textInput"
              isDisabled
              options={[currentBranchDropdownOption]}
              size="md"
              value={currentBranchDropdownOption}
            >
              <Option>{currentBranchDropdownOption.label}</Option>
            </Select>
          </Row>
          <MergeStatus message={mergeStatusMessage} status={status} />
          <Space size={10} />
          {isConflicting ? (
            <ConflictInfo
              browserSupportedRemoteUrl={
                gitMetaData?.browserSupportedRemoteUrl || ""
              }
              learnMoreLink={gitConflictDocumentUrl}
            />
          ) : null}

          {showMergeSuccessIndicator ? <MergeSuccessIndicator /> : null}
          {isMerging ? (
            <StatusbarWrapper>
              <Statusbar
                completed={!isMerging}
                message={createMessage(IS_MERGING)}
                period={6}
              />
            </StatusbarWrapper>
          ) : null}
        </Container>
      </ModalBody>
      <ModalFooter style={{ minHeight: 52 }}>
        {!showMergeSuccessIndicator && showMergeButton ? (
          <Button
            className="t--git-merge-button"
            data-testid="t--git-merge-button"
            isDisabled={mergeBtnDisabled}
            isLoading={isMerging}
            onClick={mergeHandler}
            size="md"
          >
            {createMessage(MERGE_CHANGES)}
          </Button>
        ) : null}
      </ModalFooter>
    </>
  );
}

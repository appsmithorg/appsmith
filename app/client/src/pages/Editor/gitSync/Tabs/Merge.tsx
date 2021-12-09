import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Title, Caption, Space } from "../components/StyledComponents";
import Dropdown from "components/ads/Dropdown";

import {
  createMessage,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  FETCH_MERGE_STATUS,
  FETCH_GIT_STATUS,
  IS_MERGING,
} from "constants/messages";
import { ReactComponent as LeftArrow } from "assets/icons/ads/arrow-left-1.svg";

import styled from "styled-components";
import Button, { Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import {
  getGitBranches,
  getGitStatus,
  getIsFetchingGitStatus,
  getMergeStatus,
} from "selectors/gitSyncSelectors";
import { DropdownOptions } from "../../GeneratePage/components/constants";
import {
  mergeBranchInit,
  fetchBranchesInit,
  resetMergeStatus,
  fetchGitStatusInit,
} from "actions/gitSyncActions";
import {
  getIsFetchingMergeStatus,
  getFetchingBranches,
  getIsMergeInProgress,
  // getPullFailed,
} from "selectors/gitSyncSelectors";
import { fetchMergeStatusInit } from "actions/gitSyncActions";
import MergeStatus, { MERGE_STATUS_STATE } from "../components/MergeStatus";
import ConflictInfo from "../components/ConflictInfo";
import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import { getIsStartingWithRemoteBranches } from "pages/Editor/gitSync/utils";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const DEFAULT_OPTION = "--Select--";
const DROPDOWNMENU_MAXHEIGHT = "350px";

export default function Merge() {
  const dispatch = useDispatch();
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitBranches = useSelector(getGitBranches);
  const isFetchingBranches = useSelector(getFetchingBranches);
  const isFetchingMergeStatus = useSelector(getIsFetchingMergeStatus);
  const mergeStatus = useSelector(getMergeStatus);
  const gitStatus: any = useSelector(getGitStatus);
  const isMergeAble = mergeStatus?.isMergeAble && gitStatus?.isClean;
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  let mergeStatusMessage = !gitStatus?.isClean
    ? createMessage(CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES)
    : mergeStatus?.message;
  // const pullFailed: any = useSelector(getPullFailed);
  const currentBranch = gitMetaData?.branchName;
  const isMerging = useSelector(getIsMergeInProgress);

  const [selectedBranchOption, setSelectedBranchOption] = useState({
    label: DEFAULT_OPTION,
    value: DEFAULT_OPTION,
  });

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
    branchOptions.unshift({
      label: "Local branches",
      isSectionHeader: true,
    });
    return branchOptions;
  }, [gitBranches]);

  const currentBranchDropdownOption = {
    label: currentBranch || "",
    value: currentBranch || "",
  };

  const mergeHandler = useCallback(() => {
    if (currentBranch && selectedBranchOption.value) {
      dispatch(
        mergeBranchInit({
          sourceBranch: currentBranch,
          destinationBranch: selectedBranchOption.value,
        }),
      );
    }
  }, [currentBranch, selectedBranchOption.value, dispatch]);

  useEffect(() => {
    dispatch(fetchGitStatusInit());
    dispatch(fetchBranchesInit());
    return () => {
      dispatch(resetMergeStatus());
    };
  }, []);

  useEffect(() => {
    // when user selects a branch to merge
    if (
      selectedBranchOption.value !== DEFAULT_OPTION &&
      currentBranch &&
      selectedBranchOption.value
    ) {
      dispatch(
        fetchMergeStatusInit({
          sourceBranch: currentBranch,
          destinationBranch: selectedBranchOption.value,
        }),
      );
    }
  }, [currentBranch, selectedBranchOption.value, dispatch]);

  const mergeBtnDisabled =
    DEFAULT_OPTION === selectedBranchOption.value ||
    isFetchingMergeStatus ||
    !isMergeAble;

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
  }

  const isConflicting = (mergeStatus?.conflictingFiles?.length || 0) > 0;
  const showMergeButton = !isConflicting && !isFetchingGitStatus && !isMerging;

  return (
    <>
      <Title>{createMessage(MERGE_CHANGES)}</Title>
      <Caption>{createMessage(SELECT_BRANCH_TO_MERGE)}</Caption>
      <Space size={4} />
      <Row>
        <Dropdown
          dropdownMaxHeight={DROPDOWNMENU_MAXHEIGHT}
          enableSearch
          fillOptions
          hasError={status === MERGE_STATUS_STATE.NOT_MERGEABLE}
          isLoading={isFetchingBranches}
          onSelect={(value?: string) => {
            if (value) setSelectedBranchOption({ label: value, value: value });
          }}
          options={branchList}
          selected={selectedBranchOption}
          showLabelOnly
          truncateOption
          width={"220px"}
        />

        <Space horizontal size={3} />
        <LeftArrow />
        <Space horizontal size={3} />
        <Dropdown
          className="textInput"
          disabled
          dropdownMaxHeight={DROPDOWNMENU_MAXHEIGHT}
          onSelect={() => null}
          options={[currentBranchDropdownOption]}
          selected={currentBranchDropdownOption}
          truncateOption
          width={"220px"}
        />
      </Row>
      <MergeStatus message={mergeStatusMessage} status={status} />
      <Space size={10} />
      <ConflictInfo isConflicting={isConflicting} />
      {showMergeButton && (
        <Button
          disabled={mergeBtnDisabled}
          isLoading={isMerging}
          onClick={mergeHandler}
          size={Size.large}
          tag="button"
          text={createMessage(MERGE_CHANGES)}
          width="max-content"
        />
      )}
      {isMerging && (
        <StatusbarWrapper>
          <Statusbar
            completed={!isMerging}
            message={createMessage(IS_MERGING)}
            period={6}
          />
        </StatusbarWrapper>
      )}
    </>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Caption, Space, Title } from "../components/StyledComponents";
import Dropdown from "components/ads/Dropdown";

import {
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  createMessage,
  FETCH_GIT_STATUS,
  FETCH_MERGE_STATUS,
  IS_MERGING,
  MERGE_CHANGES,
  MERGED_SUCCESSFULLY,
  SELECT_BRANCH_TO_MERGE,
} from "@appsmith/constants/messages";
import { ReactComponent as LeftArrow } from "assets/icons/ads/arrow-left-1.svg";

import styled, { useTheme } from "styled-components";
import Button, { Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
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
} from "selectors/gitSyncSelectors";
import { DropdownOptions } from "../../GeneratePage/components/constants";
import {
  fetchBranchesInit,
  fetchGitStatusInit,
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
import { Text, Case, TextType } from "design-system";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const DEFAULT_OPTION = "--Select--";
const DROPDOWNMENU_MAXHEIGHT = "350px";

function MergeSuccessIndicator() {
  const theme = useTheme() as Theme;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <SuccessTick height="36px" style={{ marginBottom: 0 }} width="30px" />
      <Text
        case={Case.UPPERCASE}
        color={Colors.GREY_9}
        style={{ marginLeft: theme.spaces[2] }}
        type={TextType.P1}
        weight="600"
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
  const gitStatus: any = useSelector(getGitStatus);
  const mergeError = useSelector(getMergeError);
  const isMergeAble = mergeStatus?.isMergeAble && gitStatus?.isClean;
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  let mergeStatusMessage = !gitStatus?.isClean
    ? createMessage(CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES)
    : mergeStatus?.message;
  // const pullFailed: any = useSelector(getPullFailed);
  const currentBranch = gitMetaData?.branchName;
  const isMerging = useSelector(getIsMergeInProgress);
  const [showMergeSuccessIndicator, setShowMergeSuccessIndicator] = useState(
    false,
  );

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

  const handleMergeSuccess = () => {
    setShowMergeSuccessIndicator(true);
  };

  const mergeHandler = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_CHANGES_BUTTON_CLICK", {
      source: "GIT_MERGE_MODAL",
    });
    if (currentBranch && selectedBranchOption.value) {
      dispatch(
        mergeBranchInit({
          payload: {
            sourceBranch: currentBranch,
            destinationBranch: selectedBranchOption.value,
          },
          onSuccessCallback: handleMergeSuccess,
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
      setShowMergeSuccessIndicator(false);
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
      <Title>{createMessage(MERGE_CHANGES)}</Title>
      <Caption>{createMessage(SELECT_BRANCH_TO_MERGE)}</Caption>
      <Space size={4} />
      <Row>
        <Dropdown
          className={Classes.MERGE_DROPDOWN}
          containerClassName={"t--merge-branch-dropdown-destination"}
          disabled={isFetchingBranches || isFetchingMergeStatus || isMerging}
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
      {isConflicting && (
        <ConflictInfo
          browserSupportedRemoteUrl={
            gitMetaData?.browserSupportedRemoteUrl || ""
          }
          learnMoreLink={gitConflictDocumentUrl}
        />
      )}

      {showMergeSuccessIndicator ? (
        <MergeSuccessIndicator />
      ) : (
        showMergeButton && (
          <Button
            className="t--git-merge-button"
            data-testid="t--git-merge-button"
            disabled={mergeBtnDisabled}
            isLoading={isMerging}
            onClick={mergeHandler}
            size={Size.large}
            tag="button"
            text={createMessage(MERGE_CHANGES)}
            width="max-content"
          />
        )
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

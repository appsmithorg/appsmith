import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import {
  BRANCH_PROTECTION_PROTECTED,
  CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES,
  createMessage,
  FETCH_GIT_STATUS,
  FETCH_MERGE_STATUS,
  IS_MERGING,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
} from "ee/constants/messages";

import Statusbar, {
  StatusbarWrapper,
} from "pages/Editor/gitSync/components/Statusbar";
import { getIsStartingWithRemoteBranches } from "pages/Editor/gitSync/utils";
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
import { MergeStatusState } from "git/constants/enums";
import MergeStatus from "./MergeStatus";
import ConflictError from "git/components/ConflictError";
import MergeSuccessIndicator from "./MergeSuccessIndicator";
import { noop } from "lodash";
import type { FetchBranchesResponseData } from "git/requests/fetchBranchesRequest.types";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import type { FetchMergeStatusResponseData } from "git/requests/fetchMergeStatusRequest.types";
import type { GitApiError } from "git/store/types";

const Container = styled.div`
  min-height: 360px;
  overflow: unset;
  padding-bottom: 4px;
`;

const MergeSelectLabel = styled(Text)`
  margin-bottom: 12px;
  color: var(--ads-v2-color-fg-emphasis);
`;

const SelectContainer = styled.div`
  display: flex;
  align-items: center;
  overflow: unset;
  padding-bottom: 4px;
`;

const StyledModalFooter = styled(ModalFooter)`
  min-height: 52px;
`;

interface BranchOption {
  label: string;
  value: string;
}

interface TabMergeViewProps {
  branches: FetchBranchesResponseData | null;
  clearMergeStatus: () => void;
  currentBranch: string | null;
  fetchBranches: () => void;
  fetchMergeStatus: (sourceBranch: string, destinationBranch: string) => void;
  isFetchBranchesLoading: boolean;
  isFetchMergeStatusLoading: boolean;
  isFetchStatusLoading: boolean;
  isMergeLoading: boolean;
  isStatusClean: boolean;
  merge: (sourceBranch: string, destinationBranch: string) => void;
  mergeError: GitApiError | null;
  mergeStatus: FetchMergeStatusResponseData | null;
  protectedBranches: FetchProtectedBranchesResponseData | null;
}

export default function TabMergeView({
  branches = null,
  clearMergeStatus = noop,
  currentBranch = null,
  fetchBranches = noop,
  fetchMergeStatus = noop,
  isFetchBranchesLoading = false,
  isFetchMergeStatusLoading = false,
  isFetchStatusLoading = false,
  isMergeLoading = false,
  isStatusClean = false,
  merge = noop,
  mergeError = null,
  mergeStatus = null,
  protectedBranches = null,
}: TabMergeViewProps) {
  const [showMergeSuccessIndicator, setShowMergeSuccessIndicator] =
    useState(false);
  const [selectedBranchOption, setSelectedBranchOption] =
    useState<BranchOption>();

  const isMergeable = mergeStatus?.isMergeAble && isStatusClean;
  let message = !isStatusClean
    ? createMessage(CANNOT_MERGE_DUE_TO_UNCOMMITTED_CHANGES)
    : mergeStatus?.message ?? null;

  const mergeBtnDisabled = isFetchMergeStatusLoading || !isMergeable;

  let status = MergeStatusState.NONE;

  if (isFetchStatusLoading) {
    status = MergeStatusState.FETCHING;
    message = createMessage(FETCH_GIT_STATUS);
  } else if (!isStatusClean) {
    status = MergeStatusState.NOT_MERGEABLE;
  } else if (isFetchMergeStatusLoading) {
    status = MergeStatusState.FETCHING;
    message = createMessage(FETCH_MERGE_STATUS);
  } else if (mergeStatus && mergeStatus?.isMergeAble) {
    status = MergeStatusState.MERGEABLE;
  } else if (mergeStatus && !mergeStatus?.isMergeAble) {
    status = MergeStatusState.NOT_MERGEABLE;
  } else if (mergeError) {
    status = MergeStatusState.ERROR;
    message = mergeError.message;
  }

  // should check after added error code for conflicting
  const isConflicting = (mergeStatus?.conflictingFiles?.length || 0) > 0;
  const showMergeButton =
    !isConflicting && !mergeError && !isFetchStatusLoading && !isMergeLoading;

  const branchList = useMemo(() => {
    const branchOptions = [] as BranchOption[];

    if (!branches) return branchOptions;

    let index = 0;

    while (true) {
      if (index === branches.length) break;

      const branchObj = branches[index];

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

      const nextBranchObj = branches[index + 1];

      if (
        getIsStartingWithRemoteBranches(
          branchObj.branchName,
          nextBranchObj?.branchName,
        )
      ) {
        break;
      }

      index++;
    }

    return branchOptions;
  }, [branches, currentBranch]);

  const currentBranchDropdownOptions = useMemo(
    () => [
      {
        label: currentBranch || "",
        value: currentBranch || "",
      },
    ],
    [currentBranch],
  );

  // ! case how to do this
  //   const handleMergeSuccess = () => {
  //     setShowMergeSuccessIndicator(true);
  //   };

  useEffect(
    function fetchBranchesOnMountffect() {
      fetchBranches();
    },
    [fetchBranches],
  );

  useEffect(
    function clearMergeStatusOnUnmountEffect() {
      return () => {
        clearMergeStatus();
      };
    },
    [clearMergeStatus],
  );

  useEffect(
    function fetchMergeStatusOnChangeEffect() {
      // when user selects a branch to merge
      if (currentBranch && selectedBranchOption?.value) {
        fetchMergeStatus(currentBranch, selectedBranchOption?.value);
        setShowMergeSuccessIndicator(false);
      }
    },
    [currentBranch, selectedBranchOption?.value, fetchMergeStatus],
  );

  const handleMergeBtnClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_CHANGES_BUTTON_CLICK", {
      source: "GIT_MERGE_MODAL",
    });

    if (currentBranch && selectedBranchOption?.value) {
      merge(currentBranch, selectedBranchOption?.value);
    }
  }, [currentBranch, merge, selectedBranchOption?.value]);

  const handleSelectBranchOption = useCallback((value?: string) => {
    if (value) setSelectedBranchOption({ label: value, value: value });
  }, []);

  const handleGetPopupContainer = useCallback((triggerNode) => {
    return triggerNode.parentNode;
  }, []);

  return (
    <>
      <ModalBody>
        <Container>
          <MergeSelectLabel kind="heading-s" renderAs="p">
            {createMessage(SELECT_BRANCH_TO_MERGE)}
          </MergeSelectLabel>
          <SelectContainer>
            <Select
              data-testid="t--merge-branch-dropdown-destination"
              dropdownClassName={"merge-dropdown"}
              dropdownMatchSelectWidth
              getPopupContainer={handleGetPopupContainer}
              isDisabled={
                isFetchBranchesLoading ||
                isFetchMergeStatusLoading ||
                isMergeLoading
              }
              isValid={status !== MergeStatusState.NOT_MERGEABLE}
              onSelect={handleSelectBranchOption}
              showSearch
              size="md"
              value={selectedBranchOption}
            >
              {branchList.map((branch) => {
                const isProtected = protectedBranches?.includes(
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
            <Icon
              className="ml-4 mr-4"
              color={"var(--ads-v2-color-fg-subtle)"}
              name="arrow-left-s-line"
              size="lg"
            />
            <Select
              className="textInput"
              isDisabled
              options={currentBranchDropdownOptions}
              size="md"
              value={currentBranchDropdownOptions[0]}
            >
              <Option>{currentBranchDropdownOptions[0].label}</Option>
            </Select>
          </SelectContainer>
          <div className="mb-4">
            <MergeStatus message={message} status={status} />
          </div>
          {isConflicting ? <ConflictError /> : null}
          {showMergeSuccessIndicator ? <MergeSuccessIndicator /> : null}
          {isMergeLoading ? (
            <StatusbarWrapper>
              <Statusbar
                completed={!isMergeLoading}
                message={createMessage(IS_MERGING)}
                period={6}
              />
            </StatusbarWrapper>
          ) : null}
        </Container>
      </ModalBody>
      <StyledModalFooter>
        {!showMergeSuccessIndicator && showMergeButton ? (
          <Button
            className="t--git-merge-button"
            data-testid="t--git-merge-button"
            isDisabled={mergeBtnDisabled}
            isLoading={isMergeLoading}
            onClick={handleMergeBtnClick}
            size="md"
          >
            {createMessage(MERGE_CHANGES)}
          </Button>
        ) : null}
      </StyledModalFooter>
    </>
  );
}

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Title, Caption, Space } from "../components/StyledComponents";
import Dropdown from "components/ads/Dropdown";

import {
  createMessage,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
  FETCH_MERGE_STATUS,
} from "constants/messages";
import { ReactComponent as MergeIcon } from "assets/icons/ads/git-merge.svg";
import { ReactComponent as LeftArrow } from "assets/icons/ads/arrow-left-1.svg";

import styled from "styled-components";
import Button, { Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { getGitBranches } from "selectors/gitSyncSelectors";
import { DropdownOptions } from "../../GeneratePage/components/constants";
import { mergeBranchInit, fetchBranchesInit } from "actions/gitSyncActions";
import {
  getIsFetchingMergeStatus,
  getFetchingBranches,
} from "selectors/gitSyncSelectors";
import { fetchMergeStatusInit } from "actions/gitSyncActions";
import StatusLoader from "../components/StatusLoader";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Flex = styled.div`
  display: flex;
`;

const DEFAULT_OPTION = "--Select--";

export default function Merge() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitBranches = useSelector(getGitBranches);
  const isFetchingBranches = useSelector(getFetchingBranches);
  const isFetchingMergeStatus = useSelector(getIsFetchingMergeStatus);
  const dispatch = useDispatch();
  const currentBranch = gitMetaData?.branchName;

  const [selectedBranchOption, setSelectedBranchOption] = useState({
    label: DEFAULT_OPTION,
    value: DEFAULT_OPTION,
  });

  const branchList = useMemo(() => {
    const listOfBranches: DropdownOptions = [];
    gitBranches.map((branchObj) => {
      if (currentBranch !== branchObj.branchName) {
        if (!branchObj.default) {
          listOfBranches.push({
            label: branchObj.branchName,
            value: branchObj.branchName,
          });
        } else {
          listOfBranches.unshift({
            label: branchObj.branchName,
            value: branchObj.branchName,
          });
        }
      }
    });
    return listOfBranches;
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
    dispatch(fetchBranchesInit());
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
    DEFAULT_OPTION === selectedBranchOption.value || isFetchingMergeStatus;

  return (
    <>
      <Title>{createMessage(MERGE_CHANGES)}</Title>
      <Space size={7} />
      <Caption>{createMessage(SELECT_BRANCH_TO_MERGE)}</Caption>
      <Space size={4} />
      <Row>
        <MergeIcon />

        <Space horizontal size={3} />

        <Dropdown
          fillOptions
          isLoading={isFetchingBranches}
          onSelect={(value?: string) => {
            if (value) setSelectedBranchOption({ label: value, value: value });
          }}
          options={branchList}
          selected={selectedBranchOption}
          showLabelOnly
          width={"220px"}
        />

        <Space horizontal size={3} />
        <LeftArrow />
        <Space horizontal size={3} />
        <Dropdown
          className="textInput"
          disabled
          onSelect={() => null}
          options={[currentBranchDropdownOption]}
          selected={currentBranchDropdownOption}
          width={"220px"}
        />
      </Row>
      {isFetchingMergeStatus && (
        <Flex>
          <Space horizontal size={10} />
          <StatusLoader loaderMsg={createMessage(FETCH_MERGE_STATUS)} />
        </Flex>
      )}
      <Space size={10} />

      <Button
        disabled={mergeBtnDisabled}
        onClick={mergeHandler}
        size={Size.medium}
        tag="button"
        text={createMessage(MERGE_CHANGES)}
        width="max-content"
      />
    </>
  );
}

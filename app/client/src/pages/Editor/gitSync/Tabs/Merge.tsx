import React, { useMemo, useState, useCallback } from "react";
import { Title, Caption, Space } from "../components/StyledComponents";
import Dropdown from "components/ads/Dropdown";

import {
  createMessage,
  MERGE_CHANGES,
  SELECT_BRANCH_TO_MERGE,
} from "constants/messages";
import { ReactComponent as MergeIcon } from "assets/icons/ads/git-merge.svg";
import { ReactComponent as LeftArrow } from "assets/icons/ads/arrow-left-1.svg";

import styled from "styled-components";
// import * as log from "loglevel";
import Button, { Size } from "components/ads/Button";
import { useSelector, useDispatch } from "react-redux";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { getGitBranches } from "selectors/gitSyncSelectors";
import { DropdownOptions } from "../../GeneratePage/components/constants";
import { mergeBranchInit } from "../../../../actions/gitSyncActions";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

// mock data
const listOfBranchesExceptCurrentBranch = [
  {
    label: "Feature/new",
    value: "Feature/new",
  },
  {
    label: "FeatureA",
    value: "FeatureA",
  },
  {
    label: "FeatureB",
    value: "FeatureB",
  },
  {
    label: "FeatureC",
    value: "FeatureC",
  },
];

export default function Merge() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitBranches = useSelector(getGitBranches);
  const dispatch = useDispatch();
  const currentBranch = gitMetaData?.branchName;

  const [selectedBranch, setSelectedBranch] = useState(currentBranch);

  const branchList = useMemo(() => {
    const listOfBranches: DropdownOptions = [];
    gitBranches.map((branchObj) => {
      if (currentBranch !== branchObj.branchName) {
        if (!branchObj.default) {
          listOfBranches.push({
            label: branchObj.branchName,
            data: { idDefault: branchObj.default },
          });
        } else {
          listOfBranches.unshift({
            label: branchObj.branchName,
            data: { idDefault: branchObj.default },
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
    if (currentBranch && selectedBranch) {
      dispatch(
        mergeBranchInit({
          sourceBranch: currentBranch,
          destinationBranch: selectedBranch,
        }),
      );
    }
  }, [currentBranch, selectedBranch, dispatch]);

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
          onSelect={(value?: string) => {
            setSelectedBranch(value);
          }}
          options={listOfBranchesExceptCurrentBranch || branchList}
          selected={{ label: selectedBranch, value: selectedBranch }}
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
      <Space size={10} />
      <Button
        onClick={mergeHandler}
        size={Size.medium}
        text={createMessage(MERGE_CHANGES)}
        width="max-content"
      />
    </>
  );
}

import React from "react";
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
import * as log from "loglevel";
import Button, { Size } from "components/ads/Button";
import { useSelector } from "react-redux";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

const Row = styled.div`
  display: flex;
  align-items: center;
`;

// mock data
const listOfBranchesExceptCurrentBranch = [
  { label: "Master", value: "master" },
  {
    label: "Feature/new",
    value: "Feature/new",
  },
];

export default function Merge() {
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranchName = gitMetaData?.branchName;

  const currentBranchDropdownOption = {
    label: currentBranchName || "",
    value: currentBranchName || "",
  };

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
          onSelect={() => {
            log.debug("selected");
          }}
          options={listOfBranchesExceptCurrentBranch}
          selected={{ label: "Master", value: "master" }}
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
        size={Size.medium}
        text={createMessage(MERGE_CHANGES)}
        width="max-content"
      />
    </>
  );
}

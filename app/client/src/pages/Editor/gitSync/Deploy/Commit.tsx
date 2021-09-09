import React, { useState } from "react";
import { Title, Caption } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  COMMIT,
  PUSH_CHANGES_IMMEDIATELY_TO,
  // PUSH,
  createMessage,
  COMMIT_AND_PUSH,
} from "constants/messages";
import styled from "styled-components";

import OptionSelector from "../components/OptionSelector";
import { noop } from "lodash";
import TextInput from "components/ads/TextInput";
import Button, { Size } from "components/ads/Button";
import Checkbox from "components/ads/Checkbox";

import { DEFAULT_REMOTE } from "../constants";

import {
  getCurrentGitBranch,
  getIsCommittingInProgress,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

// mock data
const options = [
  { label: "Master", value: "master" },
  { label: "Feature/new-feature", value: "Feature/new-feature" },
];

export default function Commit() {
  const currentBranch = useSelector(getCurrentGitBranch);
  const [pushImmediately, setPushImmediately] = useState(true);
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const dispatch = useDispatch();

  const handleCommit = () => {
    dispatch(commitToRepoInit({ commitMessage, pushImmediately }));
  };

  return (
    <>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <Row>
          <Caption>{createMessage(COMMIT_TO)}&nbsp;</Caption>
          <OptionSelector
            onSelect={noop}
            options={options}
            selected={{
              label: "Feature/new-feature",
              value: "Feature/new-feature",
            }}
          />
        </Row>
        <TextInput
          defaultValue={commitMessage}
          fill
          onChange={setCommitMessage}
        />
        <Space size={4} />
        <Checkbox
          isDefaultChecked
          label={`${createMessage(
            PUSH_CHANGES_IMMEDIATELY_TO,
          )} ${DEFAULT_REMOTE}/${currentBranch}`}
          onCheckChange={(checked: boolean) => setPushImmediately(checked)}
        />
        <Space size={8} />
        <Button
          isLoading={isCommittingInProgress}
          onClick={handleCommit}
          size={Size.medium}
          text={
            !pushImmediately
              ? createMessage(COMMIT)
              : createMessage(COMMIT_AND_PUSH)
          }
          width="max-content"
        />
      </Section>
      {/* <Section>
        <div>
          <Row>
            <Caption>{createMessage(PUSH)}&nbsp;</Caption>
            <OptionSelector
              onSelect={noop}
              options={options}
              selected={{
                label: "Feature/new-feature",
                value: "Feature/new-feature",
              }}
            />
          </Row>
          <Button
            size={Size.medium}
            text={createMessage(PUSH)}
            width="max-content"
          />
        </div>
      </Section> */}
    </>
  );
}

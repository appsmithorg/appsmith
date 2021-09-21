import React, { useState } from "react";
import { Title } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  COMMIT,
  PUSH_CHANGES_IMMEDIATELY_TO,
  PUSH_CHANGES,
  PUSH_TO,
  createMessage,
  COMMIT_AND_PUSH,
  COMMITTED_SUCCESSFULLY,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import Checkbox, { LabelContainer } from "components/ads/Checkbox";

import { DEFAULT_REMOTE } from "../constants";

import {
  getIsCommittingInProgress,
  getIsPushingToGit,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";

import { withTheme } from "styled-components";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import { pushToRepoInit } from "../../../../actions/gitSyncActions";

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const SectionTitle = styled.div`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.CHARCOAL};
  & .branch {
    color: ${Colors.CRUSTA};
  }
`;

const Container = styled.div`
  width: 100%;
  && ${LabelContainer} span {
    color: ${Colors.CHARCOAL};
  }
`;

const Commit = withTheme(function Commit({ theme }: { theme: Theme }) {
  const [pushImmediately, setPushImmediately] = useState(true);
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const isPushingToGit = useSelector(getIsPushingToGit);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const currentBranchName = gitMetaData?.branchName;
  const dispatch = useDispatch();
  // eslint-disable-next-line
  const [commitDisabled, setCommitDisabled] = useState(false);

  const handleCommit = () => {
    dispatch(commitToRepoInit({ commitMessage, doPush: pushImmediately }));
  };

  const handlePushToGit = () => {
    dispatch(pushToRepoInit());
  };

  const commitButtonText = commitDisabled
    ? createMessage(COMMITTED_SUCCESSFULLY)
    : !pushImmediately
    ? createMessage(COMMIT)
    : createMessage(COMMIT_AND_PUSH);

  return (
    <Container>
      <Title>{createMessage(DEPLOY_YOUR_APPLICATION)}</Title>
      <Section>
        <Row>
          <SectionTitle>
            <span>{createMessage(COMMIT_TO)}</span>
            <span className="branch">&nbsp;{currentBranchName}</span>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <TextInput
          autoFocus
          defaultValue={commitMessage}
          disabled={commitDisabled}
          fill
          onChange={setCommitMessage}
        />
        <Space size={3} />
        <Checkbox
          isDefaultChecked
          label={`${createMessage(
            PUSH_CHANGES_IMMEDIATELY_TO,
          )} ${DEFAULT_REMOTE}/${currentBranchName}`}
          onCheckChange={(checked: boolean) => setPushImmediately(checked)}
        />
        <Space size={11} />
        <Button
          disabled={commitDisabled}
          isLoading={isCommittingInProgress}
          onClick={handleCommit}
          size={Size.medium}
          text={commitButtonText}
          width="max-content"
        />
      </Section>
      {/** TODO: handle error cases and create new branch for push */}

      <Section>
        <Space size={10} />
        <Row>
          {/** TODO: refactor dropdown component to avoid negative margins */}
          <SectionTitle
            style={{
              marginRight: -1 * theme.spaces[2],
              top: -1,
              position: "relative",
            }}
          >
            {createMessage(PUSH_TO)}
            <span className="branch">&nbsp;{currentBranchName}</span>
          </SectionTitle>
        </Row>
        <Space size={3} />
        <Button
          category={Category.tertiary}
          isLoading={isPushingToGit}
          onClick={handlePushToGit}
          size={Size.medium}
          text={createMessage(PUSH_CHANGES)}
          width="max-content"
        />
      </Section>
    </Container>
  );
});

export default Commit;

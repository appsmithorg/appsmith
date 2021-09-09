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
  getCurrentGitBranch,
  getIsCommittingInProgress,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import OptionSelector from "../components/OptionSelector";
import { noop } from "lodash";

import { withTheme } from "styled-components";

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

const StyledCheckbox = styled(Checkbox)`
  & {
    color: red;
  }
`;

const Container = styled.div`
  width: 100%;
  && ${LabelContainer} span {
    color: ${Colors.CHARCOAL};
  }
`;

// mock data
const options = [
  { label: "Master", value: "master" },
  { label: "Feature/new-feature", value: "Feature/new-feature" },
];

const Commit = withTheme(function Commit({ theme }: { theme: Theme }) {
  const currentBranch = useSelector(getCurrentGitBranch);
  const [pushImmediately, setPushImmediately] = useState(true);
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const dispatch = useDispatch();

  // eslint-disable-next-line
  const [commitDisabled, setCommitDisabled] = useState(false);

  const handleCommit = () => {
    dispatch(commitToRepoInit({ commitMessage, pushImmediately }));
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
            <span className="branch">&nbsp;{currentBranch}</span>
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
          )} ${DEFAULT_REMOTE}/${currentBranch}`}
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
          </SectionTitle>
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
          category={Category.tertiary}
          size={Size.medium}
          text={createMessage(PUSH_CHANGES)}
          width="max-content"
        />
      </Section>
    </Container>
  );
});

export default Commit;

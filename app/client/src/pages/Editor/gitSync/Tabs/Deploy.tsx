import React, { useEffect, useState } from "react";
import { Title } from "../components/StyledComponents";
import {
  DEPLOY_YOUR_APPLICATION,
  COMMIT_TO,
  createMessage,
  COMMIT_AND_PUSH,
} from "constants/messages";
import styled from "styled-components";
import TextInput from "components/ads/TextInput";
import Button, { Size } from "components/ads/Button";
import { LabelContainer } from "components/ads/Checkbox";

import {
  getGitStatus,
  getIsFetchingGitStatus,
  getIsCommittingInProgress,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { commitToRepoInit } from "actions/gitSyncActions";

import { Space } from "../components/StyledComponents";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import DeployPreview from "../components/DeployPreview";
import { fetchGitStatusInit } from "actions/gitSyncActions";
// import { getGitPushError } from "selectors/gitSyncSelectors";
// import Text, { TextType } from "components/ads/Text";
import { getIsCommitSuccessful } from "selectors/gitSyncSelectors";

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

function Deploy() {
  const [commitMessage, setCommitMessage] = useState("Initial Commit");
  // const [showCompleteError, setShowCompleteError] = useState(false);
  const isCommittingInProgress = useSelector(getIsCommittingInProgress);
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const gitStatus = useSelector(getGitStatus);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const isCommitAndPushSuccessful = useSelector(getIsCommitSuccessful);
  // const gitPushError = useSelector(getGitPushError);
  // const errorMsgRef = useRef<HTMLDivElement>(null);

  const hasChangesToCommit = !gitStatus?.isClean;

  const currentBranch = gitMetaData?.branchName;
  const dispatch = useDispatch();

  const handleCommit = () => {
    if (currentBranch) {
      dispatch(
        commitToRepoInit({
          commitMessage,
          doPush: true, // to push with commit
        }),
      );
    }
  };

  const commitButtonText = createMessage(COMMIT_AND_PUSH);

  useEffect(() => {
    dispatch(fetchGitStatusInit());
  }, []);

  const commitButtonDisabled = !hasChangesToCommit || !commitMessage;
  const commitButtonLoading = isCommittingInProgress || isFetchingGitStatus;

  // const errorMsgShowMoreEnabled = useMemo(() => {
  //   let showMoreEnabled = false;
  //   if (errorMsgRef && errorMsgRef.current) {
  //     const element = errorMsgRef.current;
  //     if (element && element?.offsetHeight && element?.scrollHeight) {
  //       showMoreEnabled = element?.offsetHeight < element?.scrollHeight;
  //     }
  //   }
  //   return showMoreEnabled;
  // }, [errorMsgRef.current, gitPushError]);

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
          disabled={!hasChangesToCommit}
          fill
          onChange={setCommitMessage}
        />

        <Space size={11} />
        <Button
          className="t--commit-button"
          disabled={commitButtonDisabled}
          isLoading={commitButtonLoading}
          onClick={handleCommit}
          size={Size.medium}
          tag="button"
          text={commitButtonText}
          width="max-content"
        />
      </Section>

      <DeployPreview showSuccess={isCommitAndPushSuccessful} />
    </Container>
  );
}

export default Deploy;

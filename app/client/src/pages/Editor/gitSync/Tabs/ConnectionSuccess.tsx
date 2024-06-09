import {
  fetchBranchesInit,
  setGitSettingsModalOpenAction,
  setIsGitSyncModalOpen,
} from "actions/gitSyncActions";
import {
  GIT_CONNECT_SUCCESS_PROTECTION_MSG,
  GIT_CONNECT_SUCCESS_TITLE,
  GIT_CONNECT_SUCCESS_ACTION_SETTINGS,
  GIT_CONNECT_SUCCESS_ACTION_CONTINUE,
  createMessage,
  GIT_CONNECT_SUCCESS_PROTECTION_DOC_CTA,
  GIT_CONNECT_SUCCESS_DEFAULT_BRANCH,
  GIT_CONNECT_SUCCESS_REPO_NAME,
} from "@appsmith/constants/messages";
import {
  Button,
  Icon,
  ModalBody,
  ModalFooter,
  Text,
  Link,
} from "design-system";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import { DOCS_BRANCH_PROTECTION_URL } from "constants/ThirdPartyConstants";

const Container = styled.div``;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const TitleText = styled(Text)`
  flex: 1;
  font-weight: 600;
`;

const InlineIcon = styled(Icon)`
  display: inline-flex;
`;

const DetailContainer = styled.div`
  width: 172px;
`;

const LinkText = styled(Text)`
  span {
    font-weight: 500;
  }
`;

function ConnectionSuccessTitle() {
  return (
    <TitleContainer>
      <Icon className="mr-1" color="#059669" name="oval-check" size="lg" />
      <TitleText
        data-testid="t--git-success-modal-title"
        kind="heading-s"
        renderAs="h3"
      >
        {createMessage(GIT_CONNECT_SUCCESS_TITLE)}
      </TitleText>
    </TitleContainer>
  );
}

function ConnectionSuccessBody() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  return (
    <>
      <div className="flex gap-x-4 mb-6">
        <DetailContainer>
          <div className="flex items-center">
            <Icon className="mr-1" name="file-list-line" size="md" />
            <Text isBold renderAs="p">
              {createMessage(GIT_CONNECT_SUCCESS_REPO_NAME)}
            </Text>
          </div>
          <Text renderAs="p">{gitMetadata?.repoName || "-"}</Text>
        </DetailContainer>
        <DetailContainer>
          <div className="flex items-center">
            <InlineIcon className="mr-1" name="git-branch" size="md" />
            <Text isBold renderAs="p">
              {createMessage(GIT_CONNECT_SUCCESS_DEFAULT_BRANCH)}
            </Text>
          </div>
          <Text renderAs="p">{gitMetadata?.defaultBranchName || "-"}</Text>
        </DetailContainer>
      </div>
      <div className="mb-1">
        <Text renderAs="p">
          {createMessage(GIT_CONNECT_SUCCESS_PROTECTION_MSG)}
        </Text>
      </div>
      <LinkText isBold renderAs="p">
        <Link href={DOCS_BRANCH_PROTECTION_URL}>
          {createMessage(GIT_CONNECT_SUCCESS_PROTECTION_DOC_CTA)}
        </Link>
      </LinkText>
    </>
  );
}

function ConnectionSuccessActions() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchBranchesInit());
  }, []);

  const handleStartGit = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: false,
      }),
    );
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  const handleOpenSettings = () => {
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: false,
      }),
    );
    dispatch(
      setGitSettingsModalOpenAction({
        open: true,
        tab: GitSettingsTab.BRANCH,
      }),
    );
    AnalyticsUtil.logEvent("GS_OPEN_GIT_SETTINGS", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  return (
    <>
      <Button
        data-testid="t--git-success-modal-open-settings-cta"
        kind="secondary"
        onClick={handleOpenSettings}
        size="md"
      >
        {createMessage(GIT_CONNECT_SUCCESS_ACTION_SETTINGS)}
      </Button>
      <Button
        data-testid="t--git-success-modal-start-using-git-cta"
        onClick={handleStartGit}
        size="md"
      >
        {createMessage(GIT_CONNECT_SUCCESS_ACTION_CONTINUE)}
      </Button>
    </>
  );
}

function ConnectionSuccess() {
  return (
    <>
      <ModalBody data-testid="t--git-success-modal-body">
        <Container>
          <ConnectionSuccessTitle />
          <ConnectionSuccessBody />
        </Container>
      </ModalBody>
      <ModalFooter>
        <ConnectionSuccessActions />
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;

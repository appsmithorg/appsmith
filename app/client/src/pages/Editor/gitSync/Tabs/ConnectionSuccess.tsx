import {
  fetchBranchesInit,
  setIsGitSyncModalOpen,
} from "actions/gitSyncActions";
import {
  BRANCH_PROTECTION_CHANGE_RULE,
  BRANCH_PROTECTION_RULES_AS_FOLLOWS,
  BRANCH_PROTECTION_RULE_1,
  BRANCH_PROTECTION_RULE_2,
  BRANCH_PROTECTION_RULE_3,
  GIT_CONNECT_SUCCESS_MESSAGE,
  GIT_CONNECT_SUCCESS_TITLE,
  OPEN_GIT_SETTINGS,
  START_USING_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Icon, ModalBody, ModalFooter, Tag, Text } from "design-system";
import { GitSyncModalTab } from "entities/GitSync";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { getCurrentAppGitMetaData } from "@appsmith/selectors/applicationSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  getDefaultGitBranchName,
  getIsGitProtectedFeatureEnabled,
} from "selectors/gitSyncSelectors";

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

const StyledIcon = styled(Icon)`
  margin-right: 8px;
`;

const FeatureList = styled.ul`
  margin-bottom: 16px;
`;
const FeatureItem = styled.li`
  display: flex;
  margin-bottom: 4px;
`;

const FeatureIcon = styled(Icon)`
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
`;

const BranchTag = styled(Tag)`
  display: inline-flex;
`;

const DefaultBranchMessage = styled(Text)`
  margin-bottom: 16px;
`;

const ProtectionRulesTitle = styled(Text)`
  margin-bottom: 8px;
`;

const features = [
  createMessage(BRANCH_PROTECTION_RULE_1),
  createMessage(BRANCH_PROTECTION_RULE_2),
  createMessage(BRANCH_PROTECTION_RULE_3),
];

function ConnectionSuccess() {
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  const defaultBranchName = useSelector(getDefaultGitBranchName);
  const isGitProtectedFeatureEnabled = useSelector(
    getIsGitProtectedFeatureEnabled,
  );
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
        isOpen: true,
        tab: GitSyncModalTab.SETTINGS,
      }),
    );
    AnalyticsUtil.logEvent("GS_START_USING_GIT", {
      repoUrl: gitMetadata?.remoteUrl,
    });
  };

  const preBranchProtectionContent = () => {
    return (
      <Text renderAs="p">{createMessage(GIT_CONNECT_SUCCESS_MESSAGE)}</Text>
    );
  };

  const postBranchProtectionContent = () => {
    return (
      <>
        <DefaultBranchMessage renderAs="p">
          Right now,{" "}
          <BranchTag isClosable={false}>{defaultBranchName}</BranchTag> is set
          as the default branch and it is protected.
        </DefaultBranchMessage>
        <ProtectionRulesTitle renderAs="p">
          {createMessage(BRANCH_PROTECTION_RULES_AS_FOLLOWS)}
        </ProtectionRulesTitle>
        <FeatureList>
          {features.map((feature) => (
            <FeatureItem key={feature}>
              <FeatureIcon
                color="var(--ads-v2-color-blue-600)"
                name="oval-check"
                size="md"
              />
              <Text>{feature}</Text>
            </FeatureItem>
          ))}
        </FeatureList>
        <Text>{createMessage(BRANCH_PROTECTION_CHANGE_RULE)}</Text>
      </>
    );
  };

  const preBranchProtectionActions = () => {
    return (
      <Button
        data-testid="t--start-using-git-button"
        onClick={handleStartGit}
        size="md"
      >
        {createMessage(START_USING_GIT)}
      </Button>
    );
  };

  const postBranchProtectionActions = () => {
    return (
      <>
        <Button
          data-testid="t--start-using-git-button"
          kind="secondary"
          onClick={handleStartGit}
          size="md"
        >
          {createMessage(START_USING_GIT)}
        </Button>
        <Button onClick={handleOpenSettings} size="md">
          {createMessage(OPEN_GIT_SETTINGS)}
        </Button>
      </>
    );
  };

  return (
    <>
      <ModalBody>
        <Container>
          <TitleContainer>
            <StyledIcon color="#059669" name="oval-check" size="lg" />
            <TitleText kind="heading-s" renderAs="h3">
              {createMessage(GIT_CONNECT_SUCCESS_TITLE)}
            </TitleText>
          </TitleContainer>
          {isGitProtectedFeatureEnabled
            ? postBranchProtectionContent()
            : preBranchProtectionContent()}
        </Container>
      </ModalBody>
      <ModalFooter>
        {isGitProtectedFeatureEnabled
          ? postBranchProtectionActions()
          : preBranchProtectionActions()}
      </ModalFooter>
    </>
  );
}

export default ConnectionSuccess;

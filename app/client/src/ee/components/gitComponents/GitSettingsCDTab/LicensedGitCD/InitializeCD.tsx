import { updateCdConfigAction } from "@appsmith/actions/gitExtendedActions";
import {
  CONFIGURE_CD_TITLE,
  GIT_CD_CONFIGURE_ENDPOINT_CD,
  GIT_CD_CONFIRM_CONFIGURATION,
  GIT_CD_FINISH_CONFIGURATION_CTA,
  GIT_CD_FOLLOW_TO_CONFIGURE,
  GIT_CD_GENERATE_API_KEY_CTA,
  GIT_CD_GENERATE_API_KEY_DESC,
  GIT_CD_LICENSED_DESC,
  GIT_CD_SELECT_BRANCH_TO_CONFIGURE,
  createMessage,
} from "@appsmith/constants/messages";
import { cdApiKeySelector } from "@appsmith/selectors/gitExtendedSelectors";
import { Button, Checkbox, Option, Select, Text } from "design-system";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFetchingBranches,
  getGitBranches,
} from "selectors/gitSyncSelectors";
import styled from "styled-components";
import GenerateAPIKey from "./GenerateAPIKey";
import CDEndpoint from "./CDEndpoint";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Container = styled.div`
  padding-top: 8px;
  overflow: auto;
  min-height: calc(360px + 52px);
`;

const SectionTitle = styled(Text)`
  font-weight: 600;
  margin-bottom: 4px;
`;

const SectionDesc = styled(Text)`
  margin-bottom: 12px;
`;

const WellContainer = styled.div`
  padding: 16px;
  border-radius: 4px;
  background-color: var(--ads-v2-color-gray-100);
  margin-bottom: 16px;
  flex: 1;
  flex-shrink: 1;
  overflow-y: auto;
`;

const WellTitle = styled(Text)`
  font-weight: 600;
  margin-bottom: 12px;
`;

const StepContainer = styled.div<{ alignCenter?: boolean }>`
  display: flex;
  align-items: ${(props) => (props.alignCenter ? "center" : "flex-start")};
  margin-bottom: 16px;
`;

const StepNum = styled(Text)`
  text-align: right;
  width: 32px;
  padding-left: 4px;
  padding-right: 4px;
`;

const BranchStepContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const BranchStepText = styled(Text)`
  flex: 1;
`;

const BranchStepSelectContainer = styled.div`
  flex: 1;
`;

const StyledSelect = styled(Select)`
  background-color: var(--ads-color-black-0);
`;

const ExpandingContainer = styled.div`
  flex: 1;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledCheckbox = styled(Checkbox)`
  flex: 1;
`;

function InitializeCD() {
  const [selectedBranch, setSelectedBranch] = useState<string>();
  const [confirmed, setConfirmed] = useState<boolean>(false);

  const gitBranches = useSelector(getGitBranches);
  const isFetchingBranches = useSelector(getFetchingBranches);
  const cdApiKey = useSelector(cdApiKeySelector);

  const branchList = useMemo(() => {
    return gitBranches
      .filter((branch) => !branch.branchName.includes("origin/"))
      .map((branch) => ({
        label: branch.branchName,
        value: branch.branchName,
      }));
  }, [gitBranches]);

  const defaultBranchName = useMemo(() => {
    const defaultBranch = gitBranches.find((branch) => branch.default);
    return defaultBranch?.branchName;
  }, [gitBranches]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!selectedBranch && defaultBranchName) {
      setSelectedBranch(defaultBranchName);
    }
  }, [selectedBranch, defaultBranchName]);

  const handleSubmit = () => {
    if (selectedBranch) {
      dispatch(updateCdConfigAction(true, selectedBranch));
      AnalyticsUtil.logEvent("GS_CONTINUOUS_DELIVERY_SETUP", {
        deploymentTool: "others",
        branch: selectedBranch,
      });
    }
  };

  return (
    <Container>
      <SectionTitle kind="heading-s" renderAs="h3">
        {createMessage(CONFIGURE_CD_TITLE)}
      </SectionTitle>
      <SectionDesc kind="body-m" renderAs="p">
        {createMessage(GIT_CD_LICENSED_DESC)}
      </SectionDesc>
      <WellContainer>
        <WellTitle renderAs="p">
          {createMessage(GIT_CD_FOLLOW_TO_CONFIGURE)}
        </WellTitle>
        <StepContainer alignCenter>
          <StepNum renderAs="p">1.</StepNum>
          <BranchStepContainer>
            <BranchStepText renderAs="p">
              {createMessage(GIT_CD_SELECT_BRANCH_TO_CONFIGURE)}
            </BranchStepText>
            <BranchStepSelectContainer>
              <StyledSelect
                data-testid="t--git-settings-cd-branch-select"
                dropdownMatchSelectWidth
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                isLoading={isFetchingBranches}
                onChange={(value) => setSelectedBranch(value)}
                showSearch
                size="md"
                value={selectedBranch}
              >
                {branchList.map((branch) => (
                  <Option key={branch.value}>{branch.value}</Option>
                ))}
              </StyledSelect>
            </BranchStepSelectContainer>
          </BranchStepContainer>
        </StepContainer>
        <StepContainer>
          <StepNum renderAs="p">2.</StepNum>
          <ExpandingContainer>
            <CDEndpoint
              branchName={selectedBranch}
              descText={createMessage(GIT_CD_CONFIGURE_ENDPOINT_CD)}
            />
          </ExpandingContainer>
        </StepContainer>
        <StepContainer>
          <StepNum renderAs="p">3.</StepNum>
          <ExpandingContainer>
            <GenerateAPIKey
              ctaText={createMessage(GIT_CD_GENERATE_API_KEY_CTA)}
              descText={createMessage(GIT_CD_GENERATE_API_KEY_DESC)}
              onClick={() => {
                AnalyticsUtil.logEvent("GS_CD_GENERATE_KEY_CLICKED", {
                  deploymentTool: "others",
                  branch: selectedBranch,
                  regenerated: false,
                });
              }}
            />
          </ExpandingContainer>
        </StepContainer>
      </WellContainer>
      <Footer>
        <StyledCheckbox
          data-testid="t--git-settings-cd-checkbox"
          isDisabled={!cdApiKey}
          isSelected={confirmed}
          onChange={(isSelected) => {
            setConfirmed(isSelected);
          }}
        >
          <Text renderAs="p">
            {createMessage(GIT_CD_CONFIRM_CONFIGURATION)}
          </Text>
        </StyledCheckbox>
        <Button isDisabled={!confirmed} onClick={handleSubmit} size="md">
          {createMessage(GIT_CD_FINISH_CONFIGURATION_CTA)}
        </Button>
      </Footer>
    </Container>
  );
}

export default InitializeCD;

import { toggleCdConfigAction } from "@appsmith/actions/gitExtendedActions";
import {
  CONFIGURE_CD_TITLE,
  GIT_CD_CONFIGURE_ENDPOINT_CD,
  GIT_CD_CONFIRM_CONFIGURATION,
  GIT_CD_FINISH_CONFIGURATION_CTA,
  GIT_CD_FOLLOW_TO_CONFIGURE,
  GIT_CD_GENERATE_API_KEY_CTA,
  GIT_CD_GENERATE_API_KEY_DESC,
  GIT_CD_LICENSED_DESC,
  createMessage,
} from "@appsmith/constants/messages";
import { cdApiKeySelector } from "@appsmith/selectors/gitExtendedSelectors";
import { Button, Checkbox, Text } from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDefaultGitBranchName } from "selectors/gitSyncSelectors";
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

const StepBodyContainer = styled.div`
  width: calc(100% - 32px);
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
  const defaultBranchName = useSelector(getDefaultGitBranchName);

  const cdApiKey = useSelector(cdApiKeySelector);

  const dispatch = useDispatch();

  useEffect(() => {
    if (!selectedBranch && defaultBranchName) {
      setSelectedBranch(defaultBranchName);
    }
  }, [selectedBranch, defaultBranchName]);

  const handleSubmit = () => {
    dispatch(toggleCdConfigAction());
    AnalyticsUtil.logEvent("GS_CONTINUOUS_DELIVERY_SETUP", {
      deploymentTool: "others",
      branch: selectedBranch,
    });
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
        <StepContainer>
          <StepNum renderAs="p">1.</StepNum>
          <StepBodyContainer>
            <CDEndpoint
              descText={createMessage(GIT_CD_CONFIGURE_ENDPOINT_CD)}
              selectedBranch={selectedBranch || "BRANCH"}
              setSelectedBranch={setSelectedBranch}
            />
          </StepBodyContainer>
        </StepContainer>
        <StepContainer>
          <StepNum renderAs="p">2.</StepNum>
          <StepBodyContainer>
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
          </StepBodyContainer>
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

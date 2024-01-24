import {
  CONFIGURE_CD_DESC,
  CONFIGURE_CD_TITLE,
  TRY_APPSMITH_ENTERPRISE,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Text } from "design-system";
import { useAppsmithEnterpriseLink } from "pages/Editor/gitSync/GitSettingsModal/TabBranch/hooks";
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  padding-top: 8px;
  padding-bottom: 16px;
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

const StyledButton = styled(Button)`
  display: inline-block;
`;

function UnlicensedGitCD() {
  const enterprisePricingLink = useAppsmithEnterpriseLink(
    "git_continuous_delivery",
  );

  return (
    <Container>
      <SectionTitle kind="heading-s" renderAs="h3">
        {createMessage(CONFIGURE_CD_TITLE)}
      </SectionTitle>
      <SectionDesc kind="body-m" renderAs="p">
        {createMessage(CONFIGURE_CD_DESC)}
      </SectionDesc>
      <StyledButton
        href={enterprisePricingLink}
        kind="primary"
        renderAs="a"
        size="md"
        target="_blank"
      >
        {createMessage(TRY_APPSMITH_ENTERPRISE)}
      </StyledButton>
    </Container>
  );
}

export default UnlicensedGitCD;

import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { Button, Icon, Text } from "design-system";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { PublishSuccessPageBodyContainer } from "./StyledComponents";

const COMMUNITY_PORTAL_BASE_URL = "https://community.appsmith.com/";
const CommunityTemplatePublishSuccess = () => {
  const currentApplication = useSelector(getCurrentApplication);

  const onVisitTemplateClick = useCallback(() => {
    openUrlInNewPage(
      `${COMMUNITY_PORTAL_BASE_URL}/template/${currentApplication?.id}`,
    );
  }, [currentApplication?.id]);

  return (
    <PublishSuccessPageBodyContainer>
      <Container>
        <TitleContainer>
          <Icon color="green" name="oval-check" size="lg" />
          <Text kind="heading-s" renderAs="h2">
            {createMessage(COMMUNITY_TEMPLATES.publishSuccessPage.title)}
          </Text>
        </TitleContainer>
        <Text kind="body-m" renderAs="p">
          {createMessage(COMMUNITY_TEMPLATES.publishSuccessPage.description)}
        </Text>
      </Container>
      <Button
        endIcon="link"
        kind="primary"
        onClick={onVisitTemplateClick}
        size="md"
      >
        {createMessage(
          COMMUNITY_TEMPLATES.publishSuccessPage.viewTemplateButton,
        )}
      </Button>
    </PublishSuccessPageBodyContainer>
  );
};

export default CommunityTemplatePublishSuccess;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 240px;
`;
const TitleContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

let windowReference: Window | null = null;
function openUrlInNewPage(url: string) {
  // If the tab is opened focus and reload else open in new tab
  if (!windowReference || windowReference.closed) {
    windowReference = window.open(url, "_blank");
  } else {
    windowReference.focus();
    windowReference.location.href = windowReference.location.origin + url;
  }
}

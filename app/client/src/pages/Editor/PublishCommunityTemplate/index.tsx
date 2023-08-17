import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Text } from "design-system";
import React from "react";
import styled from "styled-components";
import BackButton from "../DataSourceEditor/BackButton";
import TemplateCardPreview from "./TemplateCardPreview";

const PublishCommunityTemplate = () => {
  return (
    <>
      <HeaderContainer>
        <Header>
          <BackButton />
        </Header>
        <Text className="title" kind="heading-xl" renderAs="h1">
          {createMessage(COMMUNITY_TEMPLATES.publishForm.title)}
        </Text>
      </HeaderContainer>
      <BodyContainer>
        <TemplateCardPreview
          excerpt="A cost tracker for OpenAI API"
          templateName="Open AI usage Dashboard"
          useCases={["Operations", "DevOps"]}
        />
      </BodyContainer>
    </>
  );
};

export default PublishCommunityTemplate;

const Header = styled.div`
  width: 100%;

  > a {
    margin: 0;
  }
`;
const defaultContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--ads-v2-spaces-7);
`;
const HeaderContainer = styled(defaultContainer)`
  border-bottom: 1px solid var(--ads-v2-color-border);
`;
const BodyContainer = styled(defaultContainer)`
  height: 100%;
`;

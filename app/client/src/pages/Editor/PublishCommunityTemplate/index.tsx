import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Text } from "design-system";
import React from "react";
import BackButton from "../DataSourceEditor/BackButton";
import {
  PublishPageBodyContainer,
  PublishPageHeader,
  PublishPageHeaderContainer,
  PublishPageTemplateDetailsInputContainer,
} from "./styledComponents";
import TemplateCardPreview from "./components/TemplateCardPreview";
import TemplateInfoForm from "./components/TemplateInfoForm";
import PublishedInfo from "./components/PublishedInfo";

const PublishCommunityTemplate = () => {
  return (
    <>
      <PublishPageHeaderContainer>
        <PublishPageHeader>
          <BackButton />
        </PublishPageHeader>
        <Text className="title" kind="heading-xl" renderAs="h1">
          {createMessage(COMMUNITY_TEMPLATES.publishForm.title)}
        </Text>
      </PublishPageHeaderContainer>
      <PublishPageBodyContainer>
        <TemplateCardPreview
          excerpt="A cost tracker for OpenAI API"
          templateName="Open AI usage Dashboard"
          useCases={["Operations", "DevOps"]}
        />
        <PublishPageTemplateDetailsInputContainer>
          <TemplateInfoForm />
          <PublishedInfo />
        </PublishPageTemplateDetailsInputContainer>
      </PublishPageBodyContainer>
    </>
  );
};

export default PublishCommunityTemplate;

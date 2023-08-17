import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Text } from "design-system";
import React, { useState } from "react";
import BackButton from "../DataSourceEditor/BackButton";
import {
  PublishPageAppSettingContainer,
  PublishPageBodyContainer,
  PublishPageHeader,
  PublishPageHeaderContainer,
  PublishPageTemplateDetailsInputContainer,
} from "./styledComponents";
import TemplateCardPreview from "./components/TemplateCardPreview";
import TemplateInfoForm from "./components/TemplateInfoForm";
import PublishedInfo from "./components/PublishedInfo";
import AuthorDetailsInput from "./components/AuthorDetailsInput";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import ApplicationSettings from "./components/ApplicationSettings";

const PublishCommunityTemplate = () => {
  const currentUser = useSelector(getCurrentUser);

  const [authorName, setAuthorName] = useState(currentUser?.name || "");
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || "");
  return (
    <>
      <PublishPageHeaderContainer>
        <PublishPageHeader>
          <BackButton />
        </PublishPageHeader>
        <Text className="title" kind="heading-xl" renderAs="h1">
          {createMessage(COMMUNITY_TEMPLATES.publishFormPage.title)}
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
          <AuthorDetailsInput
            authorEmail={authorEmail}
            authorName={authorName}
            disableEmail={!!currentUser?.email}
            disableName={!!currentUser?.name}
            setAuthorEmail={setAuthorEmail}
            setAuthorName={setAuthorName}
          />
          <PublishPageAppSettingContainer>
            <ApplicationSettings isForkable isPublic />
          </PublishPageAppSettingContainer>
          <PublishedInfo />
        </PublishPageTemplateDetailsInputContainer>
      </PublishPageBodyContainer>
    </>
  );
};

export default PublishCommunityTemplate;

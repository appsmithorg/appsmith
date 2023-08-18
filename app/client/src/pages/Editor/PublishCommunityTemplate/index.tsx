import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Text } from "design-system";
import React from "react";
import BackButton from "../DataSourceEditor/BackButton";
import CommunityTemplateForm from "./CommunityTemplateForm";
import {
  PublishPageHeader,
  PublishPageHeaderContainer,
} from "./styledComponents";

const PublishCommunityTemplate = () => {
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
      <CommunityTemplateForm />
    </>
  );
};

export default PublishCommunityTemplate;

import {
  COMMUNITY_TEMPLATES,
  createMessage,
} from "@appsmith/constants/messages";
import { Button, Text } from "design-system";
import React, { useMemo, useState } from "react";
import BackButton from "../DataSourceEditor/BackButton";
import {
  PublishPageAppSettingContainer,
  PublishPageBodyContainer,
  PublishPageFooterContainer,
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

  const [templateName, setTemplateName] = useState("");
  const [templateExcerpt, setTemplateExcerpt] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");

  const [authorName, setAuthorName] = useState(currentUser?.name || "");
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || "");

  const [isPublicSetting, setIsPublicSetting] = useState(true);
  const [isForkableSetting, setIsForkableSetting] = useState(true);

  const isFormValid = useMemo(() => {
    const requiredFields = [templateName, authorName, authorEmail];
    const areRequiredFieldsPresent = requiredFields.every(
      (field) => field.length > 0,
    );
    const areSettingsTurnedON = isPublicSetting && isForkableSetting;
    return areRequiredFieldsPresent && areSettingsTurnedON;
  }, [
    templateName,
    authorName,
    authorEmail,
    isPublicSetting,
    isForkableSetting,
  ]);

  const publishToCommunity = () => {
    if (!isFormValid) {
      return;
    }
  };
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
          excerpt={templateExcerpt}
          templateName={templateName}
          useCases={["Operations", "DevOps"]}
        />
        <PublishPageTemplateDetailsInputContainer>
          <TemplateInfoForm
            setTemplateDescription={setTemplateDescription}
            setTemplateExcerpt={setTemplateExcerpt}
            setTemplateName={setTemplateName}
            templateDescription={templateDescription}
            templateExcerpt={templateExcerpt}
            templateName={templateName}
          />
          <AuthorDetailsInput
            authorEmail={authorEmail}
            authorName={authorName}
            disableEmail={!!currentUser?.email}
            disableName={!!currentUser?.name}
            setAuthorEmail={setAuthorEmail}
            setAuthorName={setAuthorName}
          />
          <PublishPageAppSettingContainer>
            <ApplicationSettings
              isForkable={isForkableSetting}
              isPublic={isPublicSetting}
              setIsForkable={setIsForkableSetting}
              setIsPublic={setIsPublicSetting}
            />
          </PublishPageAppSettingContainer>
          <PublishedInfo />
        </PublishPageTemplateDetailsInputContainer>
      </PublishPageBodyContainer>
      <PublishPageFooterContainer>
        <Button
          isDisabled={!isFormValid}
          onClick={publishToCommunity}
          size="md"
        >
          {createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.footerPublishButton,
          )}
        </Button>
      </PublishPageFooterContainer>
    </>
  );
};

export default PublishCommunityTemplate;

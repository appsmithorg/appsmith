import React, { useMemo, useState } from "react";
import ApplicationSettings from "./components/ApplicationSettings";
import AuthorDetailsInput from "./components/AuthorDetailsInput";
import PublishedInfo from "./components/PublishedInfo";
import TemplateCardPreview from "./components/TemplateCardPreview";
import TemplateInfoForm from "./components/TemplateInfoForm";
import {
  PublishPageBodyContainer,
  PublishPageTemplateDetailsInputContainer,
  PublishPageAppSettingContainer,
  PublishPageFooterContainer,
} from "./styledComponents";
import { publishCommunityTemplate } from "actions/communityTemplateActions";
import { useSelector, useDispatch } from "react-redux";
import { isPublishingCommunityTempalteSelector } from "selectors/communityTemplatesSelector";
import { getCurrentUser } from "selectors/usersSelectors";
import { COMMUNITY_TEMPLATES } from "@appsmith/constants/messages";
import { Button } from "design-system";
import { createMessage } from "design-system-old/build/constants/messages";

const CommunityTemplateForm = () => {
  const currentUser = useSelector(getCurrentUser);
  const dispatch = useDispatch();
  const isPublishing = useSelector(isPublishingCommunityTempalteSelector);

  const [templateName, setTemplateName] = useState("");
  const [templateExcerpt, setTemplateExcerpt] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateUseCases, settemplateUseCases] = useState<string[]>([]);

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
    dispatch(publishCommunityTemplate());
  };
  return (
    <>
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
            setTemplateUseCases={settemplateUseCases}
            templateDescription={templateDescription}
            templateExcerpt={templateExcerpt}
            templateName={templateName}
            templateUseCases={templateUseCases}
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
          isLoading={isPublishing}
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

export default CommunityTemplateForm;

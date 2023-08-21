import { COMMUNITY_TEMPLATES } from "@appsmith/constants/messages";
import { publishCommunityTemplate } from "actions/communityTemplateActions";
import { Button } from "design-system";
import { createMessage } from "design-system-old/build/constants/messages";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isPublishingCommunityTempalteSelector } from "selectors/communityTemplatesSelector";
import { getCurrentApplication } from "selectors/editorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  PublishPageAppSettingContainer,
  PublishPageBodyContainer,
  PublishPageFooterContainer,
  PublishPageTemplateDetailsInputContainer,
} from "./StyledComponents";
import ApplicationSettings from "./components/ApplicationSettings";
import AuthorDetailsInput from "./components/AuthorDetailsInput";
import PublishedInfo from "./components/PublishedInfo";
import TemplateCardPreview from "./components/TemplateCardPreview";
import TemplateInfoForm from "./components/TemplateInfoForm";

const CommunityTemplateForm = () => {
  const currentUser = useSelector(getCurrentUser);
  const isPublishing = useSelector(isPublishingCommunityTempalteSelector);
  const currentApplication = useSelector(getCurrentApplication);
  const dispatch = useDispatch();

  const [templateName, setTemplateName] = useState("");
  const [templateExcerpt, setTemplateExcerpt] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateUseCases, settemplateUseCases] = useState<string[]>([]);

  const [authorName, setAuthorName] = useState(currentUser?.name || "");
  const [authorEmail, setAuthorEmail] = useState(currentUser?.email || "");

  const [isPublicSetting, setIsPublicSetting] = useState(true);
  const [isForkableSetting, setIsForkableSetting] = useState(true);

  useEffect(() => {
    AnalyticsUtil.logEvent("COMMUNITY_TEMPLATE_PUBLISH_INTENTION", {
      id: currentApplication?.id,
    });
  }, []);

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
    AnalyticsUtil.logEvent("COMMUNITY_TEMPLATE_PUBLISH_CLICK", {
      id: currentApplication?.id,
    });
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

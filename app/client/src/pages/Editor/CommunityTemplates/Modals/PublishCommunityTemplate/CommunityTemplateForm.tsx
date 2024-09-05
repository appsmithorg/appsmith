import { COMMUNITY_TEMPLATES, createMessage } from "ee/constants/messages";
import { publishCommunityTemplate } from "actions/communityTemplateActions";
import { Button, Checkbox } from "@appsmith/ads";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  PublishPageAppSettingContainer,
  PublishPageBodyContainer,
  PublishPageFooterContainer,
  PublishPageTemplateDetailsInputContainer,
} from "./StyledComponents";
import ApplicationSettings from "./components/ApplicationSettings";
import AuthorDetailsInput from "./components/AuthorDetailsInput";
import PublishedInfo from "./components/PublishedInfo";
import TemplateInfoForm from "./components/TemplateInfoForm";
import { viewerURL } from "ee/RouteBuilder";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

interface Props {
  onPublishSuccess: () => void;
}

const CommunityTemplateForm = ({ onPublishSuccess }: Props) => {
  const currentUser = useSelector(getCurrentUser);
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

  const [tnCCheck, setTnCCheck] = useState(false);
  const currentBasePageId: string = useSelector(getCurrentBasePageId);

  useEffect(() => {
    AnalyticsUtil.logEvent("COMMUNITY_TEMPLATE_PUBLISH_INTENTION", {
      id: currentApplication?.id,
    });
  }, []);

  useEffect(() => {
    if (!currentApplication?.name) return;
    setTemplateName(currentApplication.name);
  }, [currentApplication?.name]);

  useEffect(() => {
    if (!currentApplication?.publishedAppToCommunityTemplate) return;
    onPublishSuccess();
  }, [currentApplication?.publishedAppToCommunityTemplate]);

  const isFormValid = useMemo(() => {
    const requiredFields = [templateName, authorName, authorEmail];
    const areRequiredFieldsPresent = requiredFields.every(
      (field) => field.length > 0,
    );
    const areSettingsTurnedON = isPublicSetting && isForkableSetting;
    return areRequiredFieldsPresent && areSettingsTurnedON && tnCCheck;
  }, [
    templateName,
    authorName,
    authorEmail,
    isPublicSetting,
    isForkableSetting,
    tnCCheck,
  ]);

  const handleConfirmationClick = () => {
    AnalyticsUtil.logEvent("COMMUNITY_TEMPLATE_PUBLISH_CLICK", {
      id: currentApplication?.id,
    });
    const basePageId =
      currentApplication?.defaultBasePageId || currentBasePageId;
    dispatch(
      publishCommunityTemplate({
        title: templateName,
        headline: templateExcerpt,
        description: templateDescription,
        useCases: templateUseCases,
        authorEmail,
        authorName,
        shouldUpdateEmail: !currentUser?.email,
        shouldUpdateName: !currentUser?.name,
        branchName:
          currentApplication?.gitApplicationMetadata?.branchName || "",
        appUrl: `${window.location.origin}${viewerURL({
          basePageId,
        })}`,
      }),
    );
  };
  return (
    <>
      <PublishPageBodyContainer>
        {/*<TemplateCardPreview
          excerpt={templateExcerpt}
          templateName={templateName}
          useCases={templateUseCases}
  />*/}
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
        <Checkbox
          data-testid="t--community-template-tnc-checkbox"
          isSelected={tnCCheck}
          onChange={setTnCCheck}
        >
          {createMessage(COMMUNITY_TEMPLATES.publishFormPage.footer.tnCText)}
        </Checkbox>
        <Button
          data-testid="t--community-template-publish-submit-btn"
          isDisabled={!isFormValid}
          isLoading={currentApplication?.isPublishingAppToCommunityTemplate}
          onClick={handleConfirmationClick}
          size="md"
        >
          {createMessage(
            COMMUNITY_TEMPLATES.publishFormPage.footer.publishButton,
          )}
        </Button>
      </PublishPageFooterContainer>
    </>
  );
};

export default CommunityTemplateForm;

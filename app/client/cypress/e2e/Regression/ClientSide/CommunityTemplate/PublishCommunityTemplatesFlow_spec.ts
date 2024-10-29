import {
  agHelper,
  communityTemplates,
  inviteModal,
  locators,
} from "../../../../support/Objects/ObjectsCore";

const communityForm = communityTemplates.locators._communityForm;
describe(
  "Publish app to Community flow",
  {
    tags: [
      "@tag.Templates",
      " @tag.excludeForAirgap",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
    ],
  },
  () => {
    afterEach(() => {
      agHelper.RefreshPage();
    });

    beforeEach(() => {
      agHelper.GetNClick(inviteModal.locators._shareButton);
      agHelper.GetNClick(inviteModal.locators._publishTab);
    });

    function prepareTemplateFormForSubmission() {
      agHelper.GetNClick(communityTemplates.locators._publishInitiateButton);

      // author details check
      const testUserName = "Demo user";
      const testUserEmail = "demo-user@appsmith.com";

      communityTemplates.AssertChangeAuthorDetailsDisablesSubmit(
        communityForm.author.name,
        testUserName,
      );
      communityTemplates.AssertChangeAuthorDetailsDisablesSubmit(
        communityForm.author.email,
        testUserEmail,
      );
      // tnC check
      agHelper.CheckUncheck(communityForm.tnCCheckbox, true);
      communityTemplates.AssertPublishButtonState(false);
    }

    it("1. Clicking close on modal header in template form should hide the share modal", () => {
      agHelper.GetNClick(communityTemplates.locators._publishInitiateButton);
      agHelper.GetNClick(locators._dialogCloseButton);
      agHelper.AssertElementAbsence(communityTemplates.locators._dialogBox);
    });

    it("2. Form Validation", () => {
      agHelper.GetNClick(communityTemplates.locators._publishInitiateButton);
      // Initial name check
      communityTemplates.AssertInputValueToEqualPreviewValue(
        communityForm.inputs.name,
        communityForm.preview.name,
      );
      //Empty name should disable publish
      agHelper.ClearNType(communityForm.inputs.name, "");
      communityTemplates.AssertPublishButtonState(true);
      //Update name input, updates preview
      const testName = "My first template";
      agHelper.ClearNType(communityForm.inputs.name, testName);
      communityTemplates.AssertInputValueToEqualPreviewValue(
        communityForm.inputs.name,
        communityForm.preview.name,
      );
      //Update excerpt input, updates preview
      const testExcerpt = "Small description of my template";
      agHelper.ClearNType(communityForm.inputs.excerpt, testExcerpt);
      communityTemplates.AssertInputValueToEqualPreviewValue(
        communityForm.inputs.excerpt,
        communityForm.preview.excerpt,
      );

      // author details check
      const testUserName = "Rahul Barwal";
      const testUserEmail = "rahul.barwal@appsmith.com";

      communityTemplates.AssertChangeAuthorDetailsDisablesSubmit(
        communityForm.author.name,
        testUserName,
      );
      communityTemplates.AssertChangeAuthorDetailsDisablesSubmit(
        communityForm.author.email,
        testUserEmail,
      );
      communityTemplates.AssertPublishButtonState(true);

      // tnC check
      agHelper.CheckUncheck(communityForm.tnCCheckbox, true);
      communityTemplates.AssertPublishButtonState(false);

      // app settings check
      communityTemplates.AssertDisablingAppSettingDisablesSubmit(
        communityForm.appSettings.public,
      );
      communityTemplates.AssertDisablingAppSettingDisablesSubmit(
        communityForm.appSettings.forkable,
      );
    });

    it("3. Publish template happy scenario", () => {
      prepareTemplateFormForSubmission();

      // TODO: Make an API request here and intercept it to happy submission

      agHelper.ValidateToastMessage("Template published to community");
    });
    it("4. Publish template unhappy scenario", () => {
      prepareTemplateFormForSubmission();

      // TODO: Make an API request here and intercept it to unhappy submission

      agHelper.ValidateToastMessage("Unable to publish");
    });
  },
);

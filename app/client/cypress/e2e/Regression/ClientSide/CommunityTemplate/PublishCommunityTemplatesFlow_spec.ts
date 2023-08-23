import {
  agHelper,
  communityTemplates,
  inviteModal,
  locators,
} from "../../../../support/Objects/ObjectsCore";

const cloudHosting = process.env.REACT_APP_CLOUD_HOSTING
  ? process.env.REACT_APP_CLOUD_HOSTING.length > 0
  : false;

const communityForm = communityTemplates.locators._communityForm;
describe("excludeForAirgap", "Publish app to Community flow", () => {
  afterEach(() => {
    if (!cloudHosting) return;
    agHelper.RefreshPage();
  });

  beforeEach(() => {
    if (!cloudHosting) return;
    agHelper.GetNClick(inviteModal.locators._shareButton);
    agHelper.GetNClick(inviteModal.locators._publishTab);
  });

  it("1. Clicking close on modal header in template form should hide the share modal", () => {
    if (!cloudHosting) return;
    agHelper.GetNClick(communityTemplates.locators._publishInitiateButton);
    agHelper.GetNClick(locators._dialogCloseButton);
    agHelper.AssertElementAbsence(communityTemplates.locators._dialogBox);
  });

  it("2. Publish template for the first time for the app", () => {
    if (!cloudHosting) return;
    agHelper.GetNClick(communityTemplates.locators._publishInitiateButton);
    // Initial name check
    communityTemplates.AssertInputValueToEqualPreviewValue(
      communityForm.inputs.name,
      communityForm.preview.name,
    );
    //Empty name should disable publish
    agHelper.UpdateInputValue(communityForm.inputs.name, "");
    communityTemplates.AssertPublishButtonState(true);
    //Update name input, updates preview
    const testName = "My first template";
    agHelper.UpdateInputValue(communityForm.inputs.name, testName);
    communityTemplates.AssertInputValueToEqualPreviewValue(
      communityForm.inputs.name,
      communityForm.preview.name,
    );
    //Update excerpt input, updates preview
    const testExcerpt = "Small description of my template";
    agHelper.UpdateInputValue(communityForm.inputs.excerpt, testExcerpt);
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
    communityTemplates.AssertPublishButtonState(false);

    // app settings check
    communityTemplates.AssertDisablingAppSettingDisablesSubmit(
      communityForm.appSettings.public,
    );
    communityTemplates.AssertDisablingAppSettingDisablesSubmit(
      communityForm.appSettings.forkable,
    );
  });
});

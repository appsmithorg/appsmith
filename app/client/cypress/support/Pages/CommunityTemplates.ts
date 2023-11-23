import { ObjectsRegistry } from "../Objects/Registry";

// Edit mode modal
export class CommunityTemplates {
  private agHelper = ObjectsRegistry.AggregateHelper;
  public locators = {
    _publishInitiateButton: "[data-testid='t--Publish-Initiate']",
    _dialogBox: ".ads-v2-modal__content",
    _communityForm: {
      inputs: {
        name: "[data-testid='t--community-template-name-input']",
        excerpt: "[data-testid='t--community-template-excerpt-input']",
        useCases: "[data-testid='t--community-template-usecases-input']",
      },
      preview: {
        name: "[data-testid='t--community-template-name-preview']",
        excerpt: "[data-testid='t--community-template-excerpt-preview']",
        useCases: "[data-testid='t--community-template-usecases-preview']",
      },
      author: {
        name: "[data-testid='t--community-template-author-name-input']",
        email: "[data-testid='t--community-template-author-email-input']",
      },
      appSettings: {
        public:
          "[data-testid='t--community-template-app-settting-public-switch']",
        forkable:
          "[data-testid='t--community-template-app-settting-forkable-switch']",
      },
      submitBtn: "[data-testid='t--community-template-publish-submit-btn']",
      tnCCheckbox: "[data-testid='t--community-template-tnc-checkbox']",
    },
  };

  AssertInputValueToEqualPreviewValue(
    inputSelector: string,
    previewSelector: string,
  ) {
    return this.agHelper.GetText(previewSelector).then((previewName) => {
      this.agHelper.ValidateFieldInputValue(
        inputSelector,
        previewName as string,
      );
    });
  }

  AssertPublishButtonState(disabled: boolean) {
    return this.agHelper.AssertElementEnabledDisabled(
      this.locators._communityForm.submitBtn,
      0,
      disabled,
    );
  }

  AssertChangeAuthorDetailsDisablesSubmit(
    selector: string,
    testUserName: string,
  ) {
    this.agHelper.GetText(selector, "val").then((authorName) => {
      if (typeof authorName === "string" && authorName === "") {
        this.AssertPublishButtonState(true);
        this.agHelper.UpdateInputValue(selector, testUserName);
      }
    });
  }

  AssertDisablingAppSettingDisablesSubmit(selector: string) {
    this.agHelper.CheckUncheck(selector, false);
    this.AssertPublishButtonState(true);
    this.agHelper.CheckUncheck(selector, true);
    this.AssertPublishButtonState(false);
  }
}

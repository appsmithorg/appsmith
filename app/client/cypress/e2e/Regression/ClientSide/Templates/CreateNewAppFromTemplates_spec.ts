import {
  agHelper,
  homePage,
  locators,
  templates,
} from "../../../../support/Objects/ObjectsCore";
import reconnectDatasourceLocators from "../../../../locators/ReconnectLocators.js";

describe(
  "Create new application from template",
  {
    tags: [
      "@tag.excludeForAirgap",
      "@tag.Workspace",
      "@tag.Templates",
      "@tag.Sanity",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
      "@tag.AccessControl",
    ],
  },
  function () {
    beforeEach(() => {
      homePage.NavigateToHome();
      homePage.OpenTemplatesDialogInStartFromTemplates();
    });

    it("1. Should be able to create new app from template list page", () => {
      agHelper.GetNClick(templates.locators._templatesCardForkButton);

      agHelper.AssertElementVisibility(locators._sidebar);
      agHelper.AssertElementAbsence(locators._loading);
    });

    it("2. Should be able to create new app from template detail page", () => {
      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.GetNClick(templates.locators._templateViewForkButton);

      agHelper.AssertElementVisibility(locators._sidebar);
      agHelper.AssertElementAbsence(locators._loading);
    });

    it("3. When reconnect modal is shown, `start with templates` dialog should not be visible", () => {
      agHelper.GetNClick("//h1[text()='Customer Messaging Tool']");
      agHelper.GetNClick(templates.locators._templateViewForkButton);

      agHelper.AssertElementVisibility(reconnectDatasourceLocators.Modal, true);
      agHelper.AssertElementAbsence(homePage._createAppFromTemplatesDialog);
      agHelper.GetNClick(reconnectDatasourceLocators.SkipToAppBtn, 0, true);
      agHelper.WaitUntilEleDisappear(reconnectDatasourceLocators.SkipToAppBtn);
    });
  },
);

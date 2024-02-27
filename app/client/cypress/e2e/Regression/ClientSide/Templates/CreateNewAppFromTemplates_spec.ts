import {
  agHelper,
  homePage,
  locators,
  templates,
} from "../../../../support/Objects/ObjectsCore";
import reconnectDatasourceLocators from "../../../../locators/ReconnectLocators.js";

describe(
  "Create new application from template",
  { tags: ["@tag.excludeForAirgap", "@tag.Workspace", "@tag.Templates"] },
  function () {
    let workspaceName: string;
    let applicationName: string;

    before(() => {
      homePage.NavigateToHome();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = `workspace-${uid}`;
        applicationName = `application-${uid}`;
        homePage.CreateNewWorkspace(workspaceName);
      });
    });

    afterEach(() => {
      homePage.NavigateToHome();
    });

    it("1. Should be able to create new app from template list page", () => {
      homePage.OpenTemplatesDialogInStartFromTemplates(workspaceName);

      agHelper.GetNClick(templates.locators._templatesCardForkButton);

      agHelper.AssertElementVisibility(locators._sidebar);
      agHelper.AssertElementAbsence(locators._loading);
    });

    it("2. Should be able to create new app from template detail page", () => {
      homePage.OpenTemplatesDialogInStartFromTemplates(workspaceName);

      agHelper.GetNClick(templates.locators._templateCard);
      agHelper.GetNClick(templates.locators._templateViewForkButton);

      agHelper.AssertElementVisibility(locators._sidebar);
      agHelper.AssertElementAbsence(locators._loading);
    });

    it("3. When reconnect modal is shown, `start with templates` dialog should not be visible", () => {
      homePage.OpenTemplatesDialogInStartFromTemplates(workspaceName);

      agHelper.GetNClick("//h1[text()='Customer Messaging Tool']");
      agHelper.GetNClick(templates.locators._templateViewForkButton);

      agHelper.AssertElementAbsence(homePage._createAppFromTemplatesDialog);
      agHelper.AssertElementVisibility(reconnectDatasourceLocators.Modal, true);
    });
  },
);

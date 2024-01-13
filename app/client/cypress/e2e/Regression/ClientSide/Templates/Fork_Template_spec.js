const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");
import reconnectDatasourceLocators from "../../../../locators/ReconnectLocators.js";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Fork a template to an workspace",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  () => {
    it("1. Fork a template to an workspace & Verify query param is updated on opening fork modal in template detailed view", () => {
      _.templates.SwitchToTemplatesTab();

      _.agHelper.GetNClick(templateLocators.templateCard);
      _.agHelper.FailIfErrorToast("INTERNAL_SERVER_ERROR");

      _.agHelper.GetNClick(templateLocators.templateViewForkButton);

      _.agHelper.WaitUntilEleAppear(
        `div[role="dialog"]:has(` + templateLocators.dialogForkButton + `)`,
      );
      _.agHelper.AssertURL("?showForkTemplateModal=true");

      cy.get(templateLocators.dialogForkButton).click({ force: true });
      _.agHelper.AssertElementAbsence(
        `div[role="dialog"]:has(` + templateLocators.dialogForkButton + `)`,
        Cypress.config().pageLoadTimeout,
      );
      _.agHelper.AssertElementVisibility(commonlocators.canvas);
    });

    it("2. Hide template fork button if user does not have a valid workspace to fork", () => {
      // Mock user with App Viewer permission
      cy.intercept("/api/v1/applications/new", {
        fixture: "Templates/MockAppViewerUser.json",
      });
      _.templates.SwitchToTemplatesTab();
      _.agHelper.WaitUntilEleAppear(templateLocators.templateCard);
      _.agHelper.FailIfErrorToast(
        "Internal server error while processing request",
      );
      _.agHelper.AssertElementExist(templateLocators.templateCard);
      _.agHelper.AssertElementAbsence(templateLocators.templateForkButton);
      _.agHelper.GetNClick(templateLocators.templateCard);
      _.agHelper.AssertElementExist(templateLocators.templateCard);
      _.agHelper.AssertElementAbsence(templateLocators.templateViewForkButton);
    });

    it("3. Check if tooltip is working in 'Reconnect Datasources'", () => {
      _.homePage.NavigateToHome();
      cy.get("body").then(($ele) => {
        if ($ele.find(reconnectDatasourceLocators.Modal).length) {
          cy.get(_.dataSources._skiptoApplicationBtn).click();
        }
      });
      cy.get(templateLocators.templatesTab).click();
      cy.wait(1000);

      cy.xpath("//h1[text()='Customer Messaging Tool']")
        .scrollIntoView()
        .wait(500)
        .click();
      _.agHelper.GetNClick(templateLocators.templateViewForkButton);

      cy.get(templateLocators.dialogForkButton).click();
      cy.get(reconnectDatasourceLocators.Modal).should("be.visible");
      cy.get(reconnectDatasourceLocators.DatasourceList)
        .find(reconnectDatasourceLocators.ListItemIcon)
        .should("be.visible");
      cy.get(reconnectDatasourceLocators.DatasourceList)
        .find(reconnectDatasourceLocators.DatasourceTitle, {
          withinSubject: null,
        })
        .first()
        .trigger("mouseover");
      cy.get(".ads-v2-tooltip").should("be.visible");
    });
  },
);

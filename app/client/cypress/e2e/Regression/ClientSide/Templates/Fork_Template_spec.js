const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");
import reconnectDatasourceLocators from "../../../../locators/ReconnectLocators.js";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Fork a template to an workspace", () => {
  it("1. Fork a template to an workspace", () => {
    _.templates.SwitchToTemplatesTab();
    cy.xpath(
      "//h1[text()='Customer Support Dashboard']/parent::div//button[contains(@class, 't--fork-template')]",
    )
      .scrollIntoView()
      .wait(500)
      .click();
    cy.get("body").then(($ele) => {
      if ($ele.find(templateLocators.templateViewForkButton).length) {
        cy.get(templateLocators.templateViewForkButton).click();
      }
    });
    _.agHelper.WaitUntilEleAppear(
      `div[role="dialog"]:has(` + templateLocators.dialogForkButton + `)`,
    );
    cy.get(templateLocators.dialogForkButton).click({ force: true });
    cy.get(commonlocators.canvas, { timeout: 30000 }).should("be.visible");
  });

  it("2. Update query param on opening fork modal in template detailed view", () => {
    _.templates.SwitchToTemplatesTab();
    cy.get(templateLocators.templateCard).first().click();
    _.agHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
    _.agHelper.GetNClick(templateLocators.templateViewForkButton);
    // cy.location().should((location) => {
    //   expect(location.search).to.eq("?showForkTemplateModal=true");
    // });
    _.agHelper.AssertURL("?showForkTemplateModal=true");
  });

  it("3. Hide template fork button if user does not have a valid workspace to fork", () => {
    // Mock user with App Viewer permission
    cy.intercept("/api/v1/applications/new", {
      fixture: "Templates/MockAppViewerUser.json",
    });
    _.templates.SwitchToTemplatesTab();
    _.agHelper.Sleep(2000);
    _.agHelper.CheckForErrorToast(
      "Internal server error while processing request",
    );
    _.agHelper.AssertElementExist(templateLocators.templateCard);
    _.agHelper.AssertElementAbsence(templateLocators.templateForkButton);

    _.agHelper.GetNClick(templateLocators.templateCard);
    _.agHelper.AssertElementExist(templateLocators.templateCard);
    _.agHelper.AssertElementAbsence(templateLocators.templateViewForkButton);
  });

  it("4. Check if tooltip is working in 'Reconnect Datasources'", () => {
    _.homePage.NavigateToHome();
    cy.get("body").then(($ele) => {
      if ($ele.find(reconnectDatasourceLocators.Modal).length) {
        cy.get(_.dataSources._skiptoApplicationBtn).click();
      }
    });
    cy.get(templateLocators.templatesTab).click();
    cy.wait(1000);
    cy.xpath(
      "//h1[text()='Customer Messaging Tool']/parent::div//button[contains(@class, 't--fork-template')]",
    )
      .scrollIntoView()
      .wait(500)
      .click();
    cy.get("body").then(($ele) => {
      if ($ele.find(templateLocators.templateViewForkButton).length) {
        cy.get(templateLocators.templateViewForkButton).click();
      }
    });
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
});

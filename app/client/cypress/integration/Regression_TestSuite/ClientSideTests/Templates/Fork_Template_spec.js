const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");
const reconnectDatasourceLocators = require("../../../../locators/ReconnectLocators.js");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const { AggregateHelper, HomePage } = ObjectsRegistry;

describe("Fork a template to an workspace", () => {
  it("1. Fork a template to an workspace", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.wait(1000);
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/parent::div//button[contains(@class, 't--fork-template')]",
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

    cy.get(commonlocators.canvas, { timeout: 30000 }).should("be.visible");
  });

  it("2. Update query param on opening fork modal in template detailed view", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.get(templateLocators.templateCard).first().click();
    AggregateHelper.CheckForErrorToast("INTERNAL_SERVER_ERROR");
    cy.get(templateLocators.templateViewForkButton).click();
    cy.location().should((location) => {
      expect(location.search).to.eq("?showForkTemplateModal=true");
    });
  });

  it("3. Hide template fork button if user does not have a valid workspace to fork", () => {
    HomePage.NavigateToHome();
    // Mock user with App Viewer permission
    cy.intercept("/api/v1/applications/new", {
      fixture: "Templates/MockAppViewerUser.json",
    });
    AggregateHelper.RefreshPage();
    HomePage.SwitchToTemplatesTab();
    AggregateHelper.Sleep(2000);
    AggregateHelper.CheckForErrorToast(
      "Internal server error while processing request",
    );
    AggregateHelper.AssertElementExist(templateLocators.templateCard);
    AggregateHelper.AssertElementAbsence(templateLocators.templateForkButton);

    AggregateHelper.GetNClick(templateLocators.templateCard);
    AggregateHelper.AssertElementExist(templateLocators.templateCard);
    AggregateHelper.AssertElementAbsence(
      templateLocators.templateViewForkButton,
    );
  });

  it("4. Check if tooltip is working in 'Reconnect Datasources'", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.wait(1000);
    cy.xpath(
      "//div[text()='Customer Messaging Tool']/parent::div//button[contains(@class, 't--fork-template')]",
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
    cy.get(reconnectDatasourceLocators.ListItemIcon)
      .first()
      .trigger("mouseover");
    cy.get("[class$='popover-open']").should("be.visible");
  });
});

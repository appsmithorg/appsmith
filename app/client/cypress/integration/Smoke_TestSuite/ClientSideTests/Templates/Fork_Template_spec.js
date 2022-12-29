const commonlocators = require("../../../../locators/commonlocators.json");
const templateLocators = require("../../../../locators/TemplatesLocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const { AggregateHelper, HomePage } = ObjectsRegistry;

describe("Fork a template to an workspace", () => {
  it("Fork a template to an workspace", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.wait(1000);
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]//span[contains(@class, 't--left-icon')]",
    )
      .scrollIntoView()
      .click();
    cy.get("body").then(($ele) => {
      if ($ele.find(templateLocators.templateViewForkButton).length) {
        cy.get(templateLocators.templateViewForkButton).click();
      }
    });
    cy.get(templateLocators.dialogForkButton).click();
    cy.get(commonlocators.canvas).should("be.visible");
  });
  it("Update query param on opening fork modal in template detailed view", () => {
    cy.NavigateToHome();
    cy.get(templateLocators.templatesTab).click();
    cy.get(templateLocators.templateCard)
      .first()
      .click();
    cy.get(templateLocators.templateViewForkButton).click();
    cy.location().should((location) => {
      expect(location.search).to.eq("?showForkTemplateModal=true");
    });
  });
  it("Hide template fork button if user does not have a valid workspace to fork", () => {
    HomePage.NavigateToHome();
    // Mock user with App Viewer permission
    cy.intercept("/api/v1/applications/new", {
      fixture: "Templates/MockAppViewerUser.json",
    });
    AggregateHelper.RefreshPage();
    HomePage.SwitchToTemplatesTab();
    AggregateHelper.AssertElementExist(templateLocators.templateCard);
    AggregateHelper.AssertElementAbsence(templateLocators.templateForkButton);

    AggregateHelper.GetNClick(templateLocators.templateCard);
    AggregateHelper.AssertElementExist(templateLocators.templateCard);
    AggregateHelper.AssertElementAbsence(
      templateLocators.templateViewForkButton,
    );
  });
});

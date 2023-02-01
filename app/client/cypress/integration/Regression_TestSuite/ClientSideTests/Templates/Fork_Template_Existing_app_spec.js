import widgetLocators from "../../../../locators/Widgets.json";
import template from "../../../../locators/TemplatesLocators.json";
const publish = require("../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../support/Objects/ObjectsCore"

beforeEach(() => {
  // Closes template dialog if it is already open - useful for retry
  cy.get("body").then(($ele) => {
    if ($ele.find(template.templateDialogBox).length) {
      cy.get(template.closeButton).click();
    }
  });
  cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains(Page1)`)
      .trigger("mouseover")
      .click({ force: true });
});


describe("Fork a template to the current app from new page popover", () => {
  it("1. Fork template from page section", () => {
    cy.wait(5000);
    cy.AddPageFromTemplate();
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.wait(4000);
    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]//span[contains(@class, 't--left-icon')]",
    )
      .scrollIntoView()
      .click();
    cy.wait(1000);
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(6000);
    _.agHelper.CheckForErrorToast(
      "Internal server error while processing request",
    );
    cy.get("body").then(($ele) => {
      if ($ele.find(widgetLocators.toastAction).length <= 0) {
        if ($ele.find(template.templateViewForkButton).length > 0) {
          cy.get(template.templateViewForkButton).click();
        }
      }
    });
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });

  it("2. Add selected page of template from page section", () => {
    cy.AddPageFromTemplate();
    cy.wait(5000);
    cy.get(template.templateDialogBox).should("be.visible");
    cy.wait(4000);
    cy.xpath("//div[text()='Customer Support Dashboard']").click();
    cy.wait("@getTemplatePages").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.xpath(template.selectAllPages)
      .next()
      .click();
    cy.xpath("//span[text()='DASHBOARD']")
      .parent()
      .next()
      .click();
    cy.get(template.templateViewForkButton).click();
    cy.wait("@fetchTemplate").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});

import templateLocators from "../../../../locators/TemplatesLocators.json";
import widgetLocators from "../../../../locators/Widgets.json";

describe("Fork a template to the current app", () => {
  it("Fork a template to the current app", () => {
    cy.get("[data-cy=start-from-template]").click();

    cy.get(templateLocators.templateForkButton)
      .first()
      .click();

    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});

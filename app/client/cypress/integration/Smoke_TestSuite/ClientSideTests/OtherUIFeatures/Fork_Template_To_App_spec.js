import widgetLocators from "../../../../locators/Widgets.json";

describe("Fork a template to the current app", () => {
  it("Fork a template to the current app", () => {
    cy.get("[data-cy=start-from-template]").click();

    cy.xpath(
      "//div[text()='Customer Support Dashboard']/following-sibling::div//button[contains(@class, 'fork-button')]",
    ).click();

    cy.get(widgetLocators.toastAction).should(
      "contain",
      "template added successfully",
    );
  });
});

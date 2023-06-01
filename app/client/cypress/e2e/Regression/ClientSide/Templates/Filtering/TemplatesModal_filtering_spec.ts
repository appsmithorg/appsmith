import * as _ from "../../../../../support/Objects/ObjectsCore";
const NAME_FILTER = "order";

describe("Templates modal filtering", () => {
  it("1. should not retain filters when trying to add a page from template(multiple attempts)", () => {
    _.entityExplorer.AddNewPage("Add page from template");
    cy.get(_.templates.locators.templateDialogBox).should("be.visible");

    cy.get(_.templates.locators._resultsHeader).then(($header) => {
      _.templates.filterTemplatesByName(NAME_FILTER);
      cy.get(_.templates.locators._resultsHeader).should(
        "not.have.text",
        $header.text(),
      );
      _.templates.closeTemplateDialogBox();

      _.entityExplorer.AddNewPage("Add page from template");
      cy.get(_.templates.locators.templateDialogBox).should("be.visible");
      cy.get(_.templates.locators._resultsHeader).should(
        "have.text",
        $header.text(),
      );
    });
  });
});

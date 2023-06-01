import * as _ from "../../../../../support/Objects/ObjectsCore";

const NAME_FILTER = "order";
const FUNCTIONS_FILTER = ["Operations", "Customer Support"];

describe("Templates page filtering", () => {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.SwitchToTemplatesTab();
  });
  beforeEach(() =>
    cy.get(_.templates.locators._templateCard).should("be.visible"),
  );
  afterEach(() => cy.reload());

  it("1. should filter templates by name", () => {
    cy.get(_.templates.locators._resultsHeader).then(($header) => {
      _.templates.filterTemplatesByName(NAME_FILTER);
      cy.get(_.templates.locators._resultsHeader).should(
        "not.have.value",
        $header.text(),
      );
    });
  });

  it("2. should filter templates by functions", () => {
    cy.get(_.templates.locators._resultsHeader).then(($header) => {
      cy.wait(500);
      _.templates.filterTemplatesByFunctions(FUNCTIONS_FILTER);
      cy.get(_.templates.locators._resultsHeader).should(
        "not.have.value",
        $header.text(),
      );
    });
  });

  it("3. should retain filters when coming back from template detailed view", () => {
    cy.get(_.templates.locators._resultsHeader).then(($header) => {
      _.templates.filterTemplatesByName(NAME_FILTER);
      _.templates.visitFirstTemplate();
      _.templates.gobackFromTemplateDetailedView();
      cy.get(_.templates.locators._templatesSearchInput).should(
        "have.value",
        NAME_FILTER,
      );
    });
  });
});

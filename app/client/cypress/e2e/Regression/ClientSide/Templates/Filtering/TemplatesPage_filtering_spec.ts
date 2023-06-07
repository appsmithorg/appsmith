import * as _ from "../../../../../support/Objects/ObjectsCore";

const NAME_FILTER = "order";
const FUNCTIONS_FILTER = ["Operations", "Customer Support"];

describe("Templates page filtering", () => {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.SwitchToTemplatesTab();
  });
  beforeEach(() =>
    _.agHelper.AssertElementVisible(_.templates.locators._templateCard),
  );
  afterEach(() => cy.reload());

  it("1. should filter templates by name", () => {
    _.agHelper
      .GetText(_.templates.locators._resultsHeader, "text")
      .then((headerText) => {
        _.templates.FilterTemplatesByName(NAME_FILTER);
        // here we check if header changes, if it does we can assume
        // list has been filtered
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "not.have.text");
        }
      });
  });

  it("2. should filter templates by functions", () => {
    _.agHelper
      .GetText(_.templates.locators._resultsHeader, "text")
      .then((headerText) => {
        _.templates.FilterTemplatesByFunctions(FUNCTIONS_FILTER);
        // here we check if header changes, if it does we can assume
        // list has been filtered
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "not.have.text");
        }
      });
  });

  it("3. should retain filters when coming back from template detailed view", () => {
    _.templates.FilterTemplatesByName(NAME_FILTER);
    _.agHelper.Sleep();
    _.agHelper
      .GetText(_.templates.locators._resultsHeader, "text")
      .then((headerText) => {
        _.templates.VisitFirstTemplate();
        _.templates.GobackFromTemplateDetailedView();
        _.agHelper
          .GetText(_.templates.locators._templatesSearchInput, "val")
          .should("equal", NAME_FILTER);
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

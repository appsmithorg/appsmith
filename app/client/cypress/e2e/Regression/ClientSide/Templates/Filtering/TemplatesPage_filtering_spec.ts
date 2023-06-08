import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Templates page filtering", () => {
  const FUNCTIONS_FILTER = ["Operations", "Customer Support"];
  const NAME_FILTER = "order";

  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.SwitchToTemplatesTab();
  });
  beforeEach(() =>
    _.agHelper.AssertElementVisible(_.templates.locators._templateCard),
  );
  afterEach(() => _.agHelper.RefreshPage());

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
        _.agHelper
          .GetElement("input[type='checkbox']")
          .check(FUNCTIONS_FILTER, {
            force: true,
          });
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
        _.agHelper.GetNClick(_.templates.locators._templateCard);
        _.agHelper.GetNClick(_.templates.locators._templateViewGoBack);
        _.agHelper
          .GetText(_.templates.locators._templatesSearchInput, "val")
          .should("equal", NAME_FILTER);
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

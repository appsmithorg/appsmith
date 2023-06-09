import {
  homePage,
  agHelper,
  templates,
} from "../../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Templates page filtering", () => {
  const FUNCTIONS_FILTER = ["Operations", "Customer Support"];
  const NAME_FILTER = "order";

  before(() => {
    homePage.NavigateToHome();
    homePage.SwitchToTemplatesTab();
  });
  beforeEach(() =>
    agHelper.AssertElementVisible(templates.locators._templateCard),
  );
  afterEach(() => agHelper.RefreshPage());

  it("1. should filter templates by name", () => {
    agHelper
      .GetText(templates.locators._resultsHeader, "text")
      .then((headerText) => {
        templates.FilterTemplatesByName(NAME_FILTER);
        // here we check if header changes, if it does we can assume
        // list has been filtered
        if (typeof headerText === "string") {
          templates.AssertResultsHeaderText(headerText, "not.have.text");
        }
      });
  });

  it("2. should filter templates by functions", () => {
    agHelper
      .GetText(templates.locators._resultsHeader, "text")
      .then((headerText) => {
        agHelper.GetElement("input[type='checkbox']").check(FUNCTIONS_FILTER, {
          force: true,
        });
        // here we check if header changes, if it does we can assume
        // list has been filtered
        if (typeof headerText === "string") {
          templates.AssertResultsHeaderText(headerText, "not.have.text");
        }
      });
  });

  it("3. should retain filters when coming back from template detailed view", () => {
    templates.FilterTemplatesByName(NAME_FILTER);
    agHelper.Sleep();
    agHelper
      .GetText(templates.locators._resultsHeader, "text")
      .then((headerText) => {
        agHelper.GetNClick(templates.locators._templateCard);
        agHelper.GetNClick(templates.locators._templateViewGoBack);
        agHelper.AssertText(
          templates.locators._templatesSearchInput,
          "val",
          NAME_FILTER,
        );
        if (typeof headerText === "string") {
          templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

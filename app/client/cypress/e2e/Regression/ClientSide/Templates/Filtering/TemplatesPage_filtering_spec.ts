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
    templates.SwitchToTemplatesTab();
  });

  it("1. should filter templates by name", () => {
    templates.RefreshTemplatesPage(true);
    templates.FilterTemplatesByName(NAME_FILTER);
    templates.AssertResultsHeaderText("Showing all 2 templates", "have.text");
  });

  it("2. should filter templates by functions", () => {
    templates.RefreshTemplatesPage(true);
    FUNCTIONS_FILTER.map((func) =>
      agHelper.CheckUncheck(`input[type='checkbox'][name='${func}']`, true),
    );

    templates.AssertResultsHeaderText(
      "Showing all 2 templates matching 2 filters",
      "have.text",
    );
  });

  it("3. should reset filters when coming back from template detailed view", () => {
    templates.RefreshTemplatesPage(false);

    agHelper
      .GetText(templates.locators._resultsHeader, "text")
      .then((headerText) => {
        templates.FilterTemplatesByName(NAME_FILTER);
        agHelper.GetNClick(templates.locators._templateCard);
        agHelper.GetNClick(templates.locators._templateViewGoBack);
        agHelper.AssertText(
          templates.locators._templatesSearchInput,
          "val",
          "",
        );
        if (typeof headerText === "string") {
          templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

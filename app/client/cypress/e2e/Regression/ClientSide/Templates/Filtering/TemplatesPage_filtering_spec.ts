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

  it("4. templates should be sorted by name", () => {
    cy.intercept({
      method: "GET",
      url: "/api/v1/app-templates",
    }).then((interception) => {
      const templatesResponse = interception.response.body.data;
      const isSorted = templatesResponse.every(
        (template: any, index: number) => {
          if (index === 0) return true;
          if ("sortPriority" in templatesResponse[index - 1]) {
            if ("sortPriority" in template) {
              return (
                template.sortPriority <=
                templatesResponse[index - 1].sortPriority
              );
            } else {
              return true;
            }
          }
          return (
            new Date(template.createdAt) <=
            new Date(templatesResponse[index - 1].createdAt)
          );
        },
      );
      expect(isSorted).to.be.true;
    });
    templates.RefreshTemplatesPage(false);
  });
});

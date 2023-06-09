import {
  agHelper,
  entityExplorer,
  templates,
} from "../../../../../support/Objects/ObjectsCore";

describe("excludeForAirgap", "Bug 17276 - Templates modal filtering", () => {
  const NAME_FILTER = "order";
  it("1. should not retain filters when trying to add a page from template(multiple attempts)", () => {
    entityExplorer.AddNewPage("Add page from template");
    agHelper.AssertElementVisible(templates.locators.templateDialogBox);

    agHelper.GetText(templates.locators._resultsHeader).then((headerText) => {
      templates.FilterTemplatesByName(NAME_FILTER);
      if (typeof headerText === "string") {
        templates.AssertResultsHeaderText(headerText, "not.have.text");
      }
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);

      entityExplorer.AddNewPage("Add page from template");
      agHelper.AssertElementVisible(templates.locators.templateDialogBox);
      if (typeof headerText === "string") {
        templates.AssertResultsHeaderText(headerText, "have.text");
      }
    });
  });
});

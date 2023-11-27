import {
  agHelper,
  templates,
} from "../../../../../support/Objects/ObjectsCore";
import PageList from "../../../../../support/Pages/PageList";

describe("excludeForAirgap", "Bug 17276 - Templates modal filtering", () => {
  const NAME_FILTER = "order";
  it("1. should not retain filters when trying to add a page from template(multiple attempts)", () => {
    PageList.AddNewPage("Add page from template");
    agHelper.AssertElementVisibility(templates.locators._templateDialogBox);

    agHelper.GetText(templates.locators._resultsHeader).then((headerText) => {
      templates.FilterTemplatesByName(NAME_FILTER);
      agHelper.Sleep();
      if (typeof headerText === "string") {
        templates.AssertResultsHeaderText(headerText, "not.have.text");
      }
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);

      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(templates.locators._templateDialogBox);
      if (typeof headerText === "string") {
        templates.AssertResultsHeaderText(headerText, "have.text");
      }
    });
  });
});

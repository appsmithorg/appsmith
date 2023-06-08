import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Templates modal filtering", () => {
  const NAME_FILTER = "order";
  it("1. should not retain filters when trying to add a page from template(multiple attempts)", () => {
    _.entityExplorer.AddNewPage("Add page from template");
    _.agHelper.AssertElementVisible(_.templates.locators.templateDialogBox);

    _.agHelper
      .GetText(_.templates.locators._resultsHeader)
      .then((headerText) => {
        _.templates.FilterTemplatesByName(NAME_FILTER);
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "not.have.text");
        }
        _.agHelper.GetNClick(_.templates.locators.templateDialogCloseButton);

        _.entityExplorer.AddNewPage("Add page from template");
        _.agHelper.AssertElementVisible(_.templates.locators.templateDialogBox);
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

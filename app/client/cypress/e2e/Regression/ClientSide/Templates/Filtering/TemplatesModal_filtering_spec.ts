import * as _ from "../../../../../support/Objects/ObjectsCore";
const NAME_FILTER = "order";

describe("Templates modal filtering", () => {
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
        _.templates.CloseTemplateDialogBox();

        _.entityExplorer.AddNewPage("Add page from template");
        _.agHelper.AssertElementVisible(_.templates.locators.templateDialogBox);
        if (typeof headerText === "string") {
          _.templates.AssertResultsHeaderText(headerText, "have.text");
        }
      });
  });
});

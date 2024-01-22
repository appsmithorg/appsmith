import {
  agHelper,
  templates,
} from "../../../../../support/Objects/ObjectsCore";
import PageList from "../../../../../support/Pages/PageList";

describe(
  "Bug 17276 - Templates modal filtering",
  { tags: ["@tag.excludeForAirgap", "@tag.Templates"] },
  () => {
    const NAME_FILTER = "order";

    it("1. should not retain filters when trying to add a page from template(multiple attempts)", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(templates.locators._templateDialogBox);

      let TEMPLATES_COUNT: number;

      templates
        .GetTemplatesCardsList()
        .then((cards) => (TEMPLATES_COUNT = cards.length));

      // Filter by name inside the dialog box
      templates.FilterTemplatesByName(NAME_FILTER);
      agHelper.Sleep();
      templates
        .GetTemplatesCardsList()
        .should((cards) =>
          expect(cards.length).to.be.lessThan(TEMPLATES_COUNT),
        );

      // Close the dialog box
      agHelper.GetNClick(templates.locators._closeTemplateDialogBoxBtn);

      // Open the dialog box again
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(templates.locators._templateDialogBox);
      templates
        .GetTemplatesCardsList()
        .should((cards) => expect(cards.length).to.be.equal(TEMPLATES_COUNT));
    });
  },
);

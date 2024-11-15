import {
  agHelper,
  templates,
} from "../../../../../support/Objects/ObjectsCore";
import PageList from "../../../../../support/Pages/PageList";
const templateLocators = require("../../../../../locators/TemplatesLocators.json");
import reconnectDatasourceLocators from "../../../../../locators/ReconnectLocators.js";

describe(
  "Bug 17276 - Templates modal filtering",
  {
    tags: [
      "@tag.excludeForAirgap",
      "@tag.Templates",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
    ],
  },
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
    it("2. Check if tooltip is working in 'Reconnect Datasources", () => {
      PageList.AddNewPage("Add page from template");
      agHelper.AssertElementVisibility(templates.locators._templateDialogBox);

      agHelper.GetNClick("//h1[text()='Customer Messaging Tool']");

      agHelper.GetNClick(templateLocators.templateViewForkButton);

      agHelper.AssertElementVisibility(reconnectDatasourceLocators.Modal, true);
      agHelper
        .GetElement(reconnectDatasourceLocators.DatasourceList)
        .find(reconnectDatasourceLocators.ListItemIcon)
        .should("be.visible");
      agHelper
        .GetElement(reconnectDatasourceLocators.DatasourceList)
        .find(reconnectDatasourceLocators.DatasourceTitle)
        .first()
        .trigger("mouseover");
      cy.get(".ads-v2-tooltip").should("be.visible");
    });
  },
);

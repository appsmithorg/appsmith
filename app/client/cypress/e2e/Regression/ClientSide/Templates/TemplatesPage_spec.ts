import { agHelper, templates } from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Templates page",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap", "@tag.Sanity"] },
  () => {
    it("1. Templates Modal should have show only 'allowPageImport:true' templates", () => {
      cy.fixture("Templates/AllowPageImportTemplates.json").then((data) => {
        cy.intercept(
          {
            method: "GET",
            url: "/api/v1/app-templates",
          },
          {
            statusCode: 200,
            body: data,
          },
        ).as("fetchAllTemplates");
        agHelper.RefreshPage(); //is important for below intercept to go thru!
        PageList.AddNewPage("Add page from template");
        agHelper.AssertElementVisibility(templates.locators._templateDialogBox);
        cy.wait("@fetchAllTemplates").then(({ request, response }) => {
          if (response) {
            // in the fixture data we are sending some tempaltes with `allowPageImport: false`

            const templatesFilteredForAllowPageImport =
              response.body.data.filter((card: any) => !!card.allowPageImport);

            templates
              .GetTemplatesCardsList()
              .should(
                "have.length",
                templatesFilteredForAllowPageImport.length,
              );
          }
        });
      });
    });
  },
);

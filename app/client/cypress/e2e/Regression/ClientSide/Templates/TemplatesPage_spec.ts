import { agHelper, templates } from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Templates page",
  {
    tags: [
      "@tag.Templates",
      "@tag.excludeForAirgap",
      "@tag.Sanity",
      "@tag.Git",
      "@tag.ImportExport",
      "@tag.Fork",
    ],
  },
  () => {
    it("1. Templates Modal should have show only 'allowPageImport:true' templates", () => {
      cy.fixture("Templates/AllowPageImportTemplates.json").then((data) => {
        cy.intercept(
          {
            method: "GET",
            url: "/api/v1/app-templates",
          },
          (req) => {
            data.responseMeta.version = req.headers["x-appsmith-version"];
            req.reply({
              statusCode: 200,
              body: data,
            });
          },
        ).as("fetchAllTemplates");
        agHelper.RefreshPage(); //is important for below intercept to go through!
        PageList.AddNewPage("Add page from template");
        agHelper.AssertElementVisibility(templates.locators._templateDialogBox);
        cy.wait("@fetchAllTemplates").then(({ response }) => {
          if (response) {
            // in the fixture data we are sending some templates with `allowPageImport: false`

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

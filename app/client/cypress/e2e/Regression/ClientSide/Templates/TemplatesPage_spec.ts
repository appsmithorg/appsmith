import { agHelper, templates } from "../../../../support/Objects/ObjectsCore";

describe(
  "Templates page",
  { tags: ["@tag.Templates", "@tag.excludeForAirgap"] },
  () => {
    it("1. Templates tab should have no impact of 'allowPageImport:true'", () => {
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
        templates.SwitchToTemplatesTab();
      agHelper.RefreshPage(); //is important for below intercept to go thru!
        cy.wait("@fetchAllTemplates").then(({ request, response }) => {
          if (response) {
            // in the fixture data we are sending some tempaltes with `allowPageImport: false`
            templates
              .GetTemplatesCardsList()
              .should("have.length", response.body.data.length);

            const templatesFilteredForAllowPageImport =
              response.body.data.filter((card: any) => !!card.allowPageImport);
            templates
              .GetTemplatesCardsList()
              .should(
                "not.have.length",
                templatesFilteredForAllowPageImport.length,
              );
          }
        });
      });
    });
  },
);

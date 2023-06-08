import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Templates page", () => {
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
      cy.visit("/templates");
      cy.wait("@fetchAllTemplates").should(({ request, response }) => {
        if (response) {
          // in the fixture data we are sending some tempaltes with `allowPageImport: false`
          _.templates
            .GetTemplatesCardsList()
            .should("have.length", response.body.data.length);

          const templatesFilteredForAllowPageImport = response.body.data.filter(
            (card) => !!card.allowPageImport,
          );
          _.templates
            .GetTemplatesCardsList()
            .should(
              "not.have.length",
              templatesFilteredForAllowPageImport.length,
            );
        }
      });
    });
  });
});

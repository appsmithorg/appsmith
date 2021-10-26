const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");

describe("Generate New CRUD Page Inside from entity explorer", function() {
  let datasourceName;
  before(() => {
    cy.startRoutesForDatasource();
    cy.createAmazonS3Datasource();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Add new Page and generate CRUD template using existing supported datasource", function() {
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(generatePage.generateCRUDPageActionCard).click();

    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.get(generatePage.datasourceDropdownOption)
      .contains(datasourceName)
      .click();

    // fetch bucket
    cy.wait("@datasourceQuery").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(generatePage.selectTableDropdown).click();

    cy.get(generatePage.dropdownOption)
      .contains("assets-test.appsmith.com")
      .scrollIntoView()
      .should("be.visible")
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});

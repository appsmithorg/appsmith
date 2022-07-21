const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");
import homePage from "../../../../locators/HomePage";
import datasource from "../../../../locators/DatasourcesEditor.json";

describe("Generate New CRUD Page Inside from entity explorer", function() {
  let datasourceName;

  beforeEach(() => {
    cy.startRoutesForDatasource();

    // TODO
    // 1. Add INVALID credential for a datasource and test the invalid datasource structure flow.
    // 2. Add 2 supported datasource and 1 not supported datasource with a fixed name to search.
  });

  it("Bug 9334: The Select widget value is sent as null when user switches between the pages", () => {
    cy.NavigateToHome();
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click({ force: true });
    cy.fillPostgresDatasourceForm();
    cy.generateUUID().then((UUID) => {
      datasourceName = `PostgresSQL NewPage ${UUID}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });
    cy.testSaveDatasource();

    //Create Dummy Page2 :
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    //Create CRUD page-Page3
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get("@dSName").then((dbName) => {
      cy.get(generatePage.generateCRUDPageActionCard).click();
      cy.get(generatePage.selectDatasourceDropdown).click();
      cy.get(generatePage.datasourceDropdownOption)
        .contains(dbName)
        .click();
    });
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();
    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();

    //Create CRUD page-Page4
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.get("@dSName").then((dbName) => {
      cy.get(generatePage.generateCRUDPageActionCard).click();
      cy.get(generatePage.selectDatasourceDropdown).click();
      cy.get(generatePage.datasourceDropdownOption)
        .contains(dbName)
        .click();
    });
    cy.wait("@getDatasourceStructure").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      .click();
    //  skip optional search column selection.
    cy.get(generatePage.generatePageFormSubmitBtn).click();
    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();

    //Navigating between CRUD (Page3) & EmptyPage (Page2):

    cy.selectEntityByName("Page2");
    cy.wait(2000);
    cy.selectEntityByName("Page3");
    cy.VerifyErrorMsgAbsence('The action "SelectQuery" has failed.');

    //Navigating between CRUD (Page3) & CRUD (Page4):
    cy.selectEntityByName("Page4");
    cy.wait(2000);
    cy.selectEntityByName("Page3"); //Back to 3
    cy.VerifyErrorMsgAbsence('The action "SelectQuery" has failed.');
  });
});

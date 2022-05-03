const pages = require("../../../../locators/Pages.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
import homePage from "../../../../locators/HomePage";
const commonlocators = require("../../../../locators/commonlocators.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("Generate New CRUD Page Inside from entity explorer", function() {
  let datasourceName;

  beforeEach(() => {
    cy.startRoutesForDatasource();
    cy.startInterceptRoutesForS3();
  });

  it("1. Create new app and Generate CRUD page using a new datasource", function() {
    cy.NavigateToHome();
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });

    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    cy.get(generatePage.generateCRUDPageActionCard).click();
    cy.get(generatePage.selectDatasourceDropdown).click();

    cy.contains("Connect New Datasource").click();

    cy.get(datasourceEditor.AmazonS3).click();
    cy.fillAmazonS3DatasourceForm();

    cy.generateUUID().then((uid) => {
      datasourceName = `Amazon S3 MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    //TestData source
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();

    // fetch bucket
    cy.wait("@getDatasourceStructure").should(
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
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@put_replaceLayoutCRUD").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@get_Actions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@post_Execute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();
  });

  it("2. Generate CRUD page from datasource ACTIVE section", function() {
    // cy.NavigateToQueryEditor();
    // cy.get(pages.integrationActiveTab)
    //   .should("be.visible")
    //   .click({ force: true });
    // cy.wait(1000);

    // cy.get(datasourceEditor.datasourceCard)
    //   .contains(datasourceName)
    //   .scrollIntoView()
    //   .should("be.visible")
    //   .closest(datasourceEditor.datasourceCard)
    //   .within(() => {
    //     cy.get(datasourceEditor.datasourceCardGeneratePageBtn).click();
    //   });

    cy.NavigateToDSGeneratePage(datasourceName);

    // fetch bucket
    cy.wait("@getDatasourceStructure").should(
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
    cy.get(generatePage.generatePageFormSubmitBtn).click();

    cy.wait("@post_replaceLayoutCRUD").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@get_Actions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait("@post_Execute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get("span:contains('GOT IT')").click();
  });

  it("3. Add new Page and generate CRUD template using existing supported datasource & Bug 9649", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasourceEditor.AmazonS3)
      .click({ force: true })
      .wait(1000);

    cy.generateUUID().then((uid) => {
      datasourceName = `Amazon S3 MOCKDS ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    cy.fillAmazonS3DatasourceForm();

    //TestData source
    cy.get(".t--test-datasource").click();
    cy.wait("@testDatasource");

    //Save source
    cy.get(".t--save-datasource").click();
    cy.wait("@createDatasource");

    //Verify page after save clicked
    // cy.get("@createDatasource").then((httpResponse) => {
    //   datasourceName = httpResponse.response.body.data.name;
    // });

    //Create Dummy Page2 :
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );

    //Creating CRUD Page3
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

    // fetch bucket
    cy.wait("@getDatasourceStructure").should(
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

    cy.wait("@put_replaceLayoutCRUD").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@get_Actions").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    //Post Execute call not happening.. hence commenting it for this case
    //cy.wait("@post_Execute").should("have.nested.property", "response.body.responseMeta.status", 200,);

    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.get("span:contains('GOT IT')").click();

    //Bug verification starts
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.selectEntityByName("ListFiles");
    cy.wait(2000);
    cy.selectEntityByName("Page3");
    cy.wait(1000);
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get(commonlocators.toastAction).should("not.exist");
    // .its("length")
    // .should("eq", 0); // checking no error msg appears!

    //.should('not.exist')
    //.should("have.length", 0)

    //cy.get('.datatable').find('tr')

    // .should("contain.text", 'The action "ListFiles" has failed.');

    cy.get(publishPage.backToEditor).click({ force: true });
    cy.wait(2000);

    //cy.VerifyErrorMsgAbsence('The action "ListFiles" has failed.')
    //cy.VerifyNoDataDisplayAbsence()
    //cy.isNotInViewport("//div[text()='haiiii hello']")
    //cy.isNotInViewport("//div[text()='No data to display']")
  });
});

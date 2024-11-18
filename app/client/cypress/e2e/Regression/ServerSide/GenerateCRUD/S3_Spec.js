import PageList from "../../../../support/Pages/PageList";

const generatePage = require("../../../../locators/GeneratePage.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");

import {
  agHelper,
  dataSources,
  deployMode,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Generate New CRUD Page Inside from entity explorer",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let datasourceName;

    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
      cy.startInterceptRoutesForS3();
    });

    it("1. Create new app and Generate CRUD page using a new datasource", function () {
      homePage.NavigateToHome();
      homePage.CreateNewApplication();
      PageList.AddNewPage("Generate page with data");
      //cy.get(generatePage.generateCRUDPageActionCard).click();
      cy.get(generatePage.selectDatasourceDropdown).click();

      cy.contains("Connect new datasource").click({ force: true });

      cy.get(datasourceEditor.AmazonS3).click();
      cy.fillAmazonS3DatasourceForm();

      cy.generateUUID().then((uid) => {
        datasourceName = `S3 Mock ${uid}`;
        cy.renameDatasource(datasourceName);
        cy.wrap(datasourceName).as("dSName");
      });

      //TestData & save datasource
      dataSources.TestSaveDatasource();
      // fetch bucket
      cy.wait("@getDatasourceStructure").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      agHelper.AssertContains("Generate a page based on your data");
      agHelper.GetNClick(generatePage.selectTableDropdown);
      agHelper.GetNClickByContains(
        generatePage.dropdownOption,
        "assets-test.appsmith.com",
      );
      agHelper.GetNClick(generatePage.generatePageFormSubmitBtn);

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

      cy.get("span:contains('Got it')").click();
    });

    it("2. Generate CRUD page from datasource ACTIVE section", function () {
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

      cy.get("span:contains('Got it')").click();
    });

    it("3. Add new Page and generate CRUD template using existing supported datasource & Bug 9649", function () {
      cy.NavigateToDatasourceEditor();
      cy.get(datasourceEditor.AmazonS3).click({ force: true }).wait(1000);

      cy.generateUUID().then((uid) => {
        datasourceName = `S3 MocDs ${uid}`;
        cy.renameDatasource(datasourceName);
        cy.wrap(datasourceName).as("dSName");
      });

      cy.fillAmazonS3DatasourceForm();

      //TestData source
      cy.get(".t--test-datasource").click();
      cy.wait("@testDatasource");

      //Save source
      cy.get(".t--save-datasource").click();
      cy.wait("@saveDatasource");

      //Verify page after save clicked
      // cy.get("@saveDatasource").then((httpResponse) => {
      //   datasourceName = httpResponse.response.body.data.name;
      // });

      //Create Dummy Page2 :
      PageList.AddNewPage();

      //Creating CRUD Page3
      PageList.AddNewPage();

      cy.get("@dSName").then((dbName) => {
        PageList.AddNewPage("Generate page with data");
        cy.get(generatePage.selectDatasourceDropdown).click();
        cy.get(generatePage.datasourceDropdownOption).contains(dbName).click();
      });

      // fetch bucket
      cy.wait("@getDatasourceStructure").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.wait(2000);
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
      cy.get("span:contains('Got it')").click();

      //Bug verification starts
      EditorNavigation.SelectEntityByName("ListFiles", EntityType.Query);
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("Page3", EntityType.Page);
      cy.wait(1000);
      deployMode.DeployApp();
      cy.wait(3000);
      cy.get(commonlocators.toastAction).should("not.exist");
      // .its("length")
      // .should("eq", 0); // checking no error msg appears!

      //.should('not.exist')
      //.should("have.length", 0)

      //cy.get('.datatable').find('tr')

      // .should("contain.text", 'The action "ListFiles" has failed.');

      deployMode.NavigateBacktoEditor();
      cy.wait(2000);

      //cy.VerifyErrorMsgAbsence('The action "ListFiles" has failed.')
      //cy.VerifyNoDataDisplayAbsence()
      //cy.isNotInViewport("//div[text()='haiiii hello']")
      //cy.isNotInViewport("//div[text()='No data to display']")
    });

    it("4. Generate CRUD page from the page menu", function () {
      PageList.AddNewPage("Generate page with data");
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

      cy.get("span:contains('Got it')").click();
    });
  },
);

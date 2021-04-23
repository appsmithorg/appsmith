const dsl = require("../../../../fixtures/executionParamsDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
let datasourceName;

describe("API Panel Test Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();

    cy.getPluginFormsAndCreateDatasource();

    cy.fillPostgresDatasourceForm();

    cy.testSaveDatasource();

    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("Create and run the query", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * from {{this.params.tableName || 'users'}} LIMIT 10", {
        parseSpecialCharSequences: false,
      });
    cy.EvaluateCurrentValue("SELECT * from undefined LIMIT 10");
    cy.runQuery();
  });

  it("Bind Table and Button with query and validate", () => {
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Query1.data", false);
    // Assert 'posts' data (default)
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Ximenez Kainz");
      // Choose static button
      cy.SearchEntityandOpen("StaticButton");
      // toggle js of onClick
      cy.get(".t--property-control-onclick")
        .find(".t--js-toggle")
        .click({ force: true });

      cy.testJsontext(
        "onclick",
        "{{Query1.run(undefined, undefined, { tableName: 'orders' })}}",
        false,
      );
      cy.get(commonlocators.editPropCrossButton).click({ force: true });
      // Publish the app
      cy.PublishtheApp();
      cy.wait("@postExecute");

      // Assert on load data in table
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("Ximenez Kainz");
      });

      cy.get(publishPage.buttonWidget)
        .first()
        .click();
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(2000);
      cy.wait("@postExecute").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
      //Assert post button click
      cy.readTabledataPublish("0", "1").then((cellData) => {
        expect(cellData).to.be.equal("PAYMENT_PENDING");
      });
    });

    /*
  it("Will pass execution params", function() {
    // Create the Api
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("MultiApi");
    cy.enterDatasourceAndPath(
      "https://jsonplaceholder.typicode.com/",
      "{{this.params.endpoint || 'posts'}}",
    );
    cy.WaitAutoSave();
    // Run it
    cy.RunAPI();

    // Bind the table
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{MultiApi.data", false);
    // Assert 'posts' data (default)
    cy.readTabledataPublish("0", "2").then((cellData) => {
      expect(cellData).to.be.equal(
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      );
    });

    // Choose static button
    cy.SearchEntityandOpen("StaticButton");
    // toggle js of onClick
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with static value
    cy.testJsontext(
      "onclick",
      "{{MultiApi.run(undefined, undefined, { endpoint: 'users",
      false,
    );
    cy.get(commonlocators.editPropCrossButton).click({ force: true });

    // Choose dynamic button
    cy.SearchEntityandOpen("DynamicButton");
    // toggle js of onClick
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with dynamicValue value
    cy.testJsontext(
      "onclick",
      "{{MultiApi.run(undefined, undefined, { endpoint: EndpointInput.text",
      false,
    );

    // Publish the app
    cy.PublishtheApp();
    cy.wait("@postExecute");

    // Assert on load data in table
    cy.readTabledataPublish("0", "2").then((cellData) => {
      expect(cellData).to.be.equal(
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      );
    });

    // Click Static button
    cy.get(publishPage.buttonWidget)
      .first()
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // Assert statically bound "users" data
    cy.readTabledataPublish("1", "1").then((cellData) => {
      expect(cellData).to.be.equal("Ervin Howell");
    });

    // Click dynamic button
    cy.get(publishPage.buttonWidget)
      .eq(1)
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // Assert dynamically bound "todos" data
    cy.readTabledataPublish("0", "2").then((cellData) => {
      expect(cellData).to.be.equal("delectus aut autem");
    });
  });
  */
  });
});

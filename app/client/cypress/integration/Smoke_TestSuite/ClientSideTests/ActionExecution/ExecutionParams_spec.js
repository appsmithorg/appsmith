const dsl = require("../../../../fixtures/executionParamsDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("API Panel Test Functionality", function() {
  let datasourceName;
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });
  it("1. Create a postgres datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("2. Create and runs query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.settings).click({ force: true });
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });
    cy.get(queryLocators.query).click({ force: true });
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from {{ this.params.tableName || 'users' }} limit 10", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();
    cy.runQuery();
  });

  it("3. Will pass execution params", function() {
    cy.selectEntityByName("WIDGETS");
    // Bind the table
    cy.get(".t--entity-collapse-toggle")
      .eq(2)
      .click({ force: true });
    cy.get(".t--entity-name")
      .contains("Table1")
      .click({ force: true });
    cy.testJsontext("tabledata", "{{Query1.data}}");
    // Assert 'posts' data (default)
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Test user 7");
    });
    // Choose static button
    cy.get(".t--entity-name")
      .contains("StaticButton")
      .click({ force: true });
    // toggle js of onClick
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with static value
    cy.testJsontext(
      "onclick",
      "{{Query1.run(undefined, undefined, { tableName: 'users' })}}",
    );
    // Choose dynamic button
    cy.get(".t--entity-name")
      .contains("DynamicButton")
      .click({ force: true });
    cy.wait(2000);
    // toggle js of onClick
    cy.get(".t--property-control-onclick").scrollIntoView();
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    // Bind with MultiApi with dynamicValue value
    cy.testJsontext(
      "onclick",
      "{{Query1.run(undefined, undefined, { tableName: EndpointInput.text })}}",
    );

    // Publish the app
    cy.PublishtheApp();

    // Assert on load data in table
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Test user 7");
    });

    // Click Static button
    cy.get(publishPage.buttonWidget)
      .first()
      .click();

    //Wait for postExecute to finish
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    // Assert statically bound "users" data
    cy.readTabledataPublish("1", "1").then((cellData) => {
      expect(cellData).to.be.equal("Test user 8");
    });

    // Click dynamic button
    cy.get(publishPage.buttonWidget)
      .eq(1)
      .click();

    //Wait for postExecute to finish
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(5000);
    // Assert dynamically bound "todos" data
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Test user 7");
    });
  });
});

const dsl = require("../../../../fixtures/executionParamsDsl.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
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
  it("Create and runs query", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
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
  it("Will pass execution params", function() {
    // Bind the table
    cy.SearchEntityandOpen("Table1");
    cy.testJsontext("tabledata", "{{Query1.data}}");
    // Assert 'posts' data (default)
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Ximenez Kainz");
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
      "{{Query1.run(undefined, undefined, { tableName: 'orders' })}}",
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
      "{{Query1.run(undefined, undefined, { tableName: EndpointInput.text })}}",
    );

    // Publish the app
    cy.PublishtheApp();
    cy.wait("@postExecute");

    // Assert on load data in table
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("Ximenez Kainz");
    });

    // Click Static button
    cy.get(publishPage.buttonWidget)
      .first()
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    // Assert statically bound "users" data
    cy.readTabledataPublish("1", "1").then((cellData) => {
      expect(cellData).to.be.equal("OUT_FOR_DELIVERY");
    });

    // Click dynamic button
    cy.get(publishPage.buttonWidget)
      .eq(1)
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    // Assert dynamically bound "todos" data
    cy.readTabledataPublish("0", "1").then((cellData) => {
      expect(cellData).to.be.equal("DISCOUNT");
    });
  });
});

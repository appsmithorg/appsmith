const dsl = require("../../../../fixtures/rundsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Create a postgres datasource", function () {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.PostgreSQL).click();
    cy.fillPostgresDatasourceForm();
    cy.testSaveDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      //Create and runs query
      cy.NavigateToActiveDSQueryPane(datasourceName);
      cy.get(queryLocators.templateMenu).click();
      _.dataSources.EnterQuery("select * from users limit 10");

      cy.EvaluateCurrentValue("select * from users limit 10");

      _.dataSources.RunQuery();
    });
  });

  it("2. Button widget test with on action query run", function () {
    _.entityExplorer.SelectEntityByName("Button1");

    cy.executeDbQuery("Query1", "onClick");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    //Input widget test with default value update with query data
    _.entityExplorer.SelectEntityByName("Input1");

    cy.get(widgetsPage.defaultInput).type(testdata.defaultInputQuery);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("3. Publish App and validate loading functionalty", function () {
    cy.PublishtheApp();
    //eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.get(widgetsPage.widgetBtn).first().click({ force: true });
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "7");
  });
});

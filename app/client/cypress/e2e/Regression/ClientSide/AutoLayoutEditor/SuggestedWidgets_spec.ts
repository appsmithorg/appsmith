import * as queryLocators from "../../../../locators/QueryEditor.json";
import * as queryEditor from "../../../../locators/QueryEditor.json";

import * as _ from "../../../../support/Objects/ObjectsCore";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let agHelper = ObjectsRegistry.AggregateHelper,
  dataSources = ObjectsRegistry.DataSources,
  tableHelper = ObjectsRegistry.Table;
let datasourceName;

describe("Addwidget from Query and bind with other widgets", function () {
  before(() => {
    cy.fixture("inputdsl").then((dsl) => {
      agHelper.AddDsl(dsl);
    });
  });

  beforeEach(() => {
    //dataSources.StartDataSourceRoutes(); //already started in index.js beforeeach
  });

  it("1. Create a PostgresDataSource", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@saveDatasource").then((httpResponse: any) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("2. Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    dataSources.CreateQueryFromActiveTab(datasourceName, true);
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM configs LIMIT 10;");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // Mock the response for this test
    cy.intercept("/api/v1/actions/execute", {
      fixture: "addWidgetTable-mock",
    });

    dataSources.RunQuery({ toValidateResponse: false });
    dataSources.ReadQueryTableResponse(0).then((text) => {
      const tableRowTxt = text;
      cy.get(queryEditor.suggestedTableWidget).click();
      _.entityExplorer.SelectEntityByName("Table1");
      tableHelper.SelectTableRow(1, 0, true, "v2");
      tableHelper.ReadTableRowColumnData(1, 0, "v2").then((tabData) => {
        const tabValue = tabData;
        cy.log("the value is" + tabValue);
        expect(tabValue).to.be.equal("5");
        expect(tableRowTxt).to.equal(tabValue);
      });
    });
  });
});

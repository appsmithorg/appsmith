const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe("Check Suggested Widgets Feature in auto-layout", function () {
  before(() => {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
  });

  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a PostgresDataSource", () => {
    cy.createPostgresDatasource();
    cy.get("@saveDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
    });
  });

  it("2. Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    _.dataSources.EnterQuery("SELECT * FROM configs LIMIT 10;");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Mock the response for this test
    cy.intercept("/api/v1/actions/execute", {
      fixture: "addWidgetTable-mock",
    });

    cy.onlyQueryRun();
    cy.xpath(queryEditor.queryResponse)
      .first()
      .invoke("text")
      .then((text) => {
        const tableRowTxt = text;
        cy.get(queryEditor.suggestedTableWidget).click();
        _.entityExplorer.SelectEntityByName("Table1");
        cy.isSelectRow(1);
        cy.readTableV2dataPublish("1", "0").then((tabData) => {
          const tabValue = tabData;
          cy.log("the value is" + tabValue);
          expect(tabValue).to.be.equal("5");
          expect(tableRowTxt).to.equal(tabValue);
        });
      });
  });
});

const queryLocators = require("../../../locators/QueryEditor.json");
const queryEditor = require("../../../locators/QueryEditor.json");

let datasourceName;
let pluginid;
let datasourceId;

describe("Add widget", function() {
  beforeEach(() => {
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;
      pluginid = httpResponse.response.body.data.pluginId;
      datasourceId = httpResponse.response.body.data.id;
      cy.log("pluginid: " + pluginid);
      cy.log("datasourceName: " + datasourceName);
      cy.log("datasourceId: " + datasourceId);
    });
    cy.wait(5000);
  });

  it("Add widget", () => {
    cy.wait(5000);
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();

    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    cy.wait(500);
    cy.get(queryEditor.runQuery).click();
    cy.wait("@postExecute").should("have.nested.property", "response.body");
    cy.get(".t--add-widget").click();
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("5");
      cy.log("the value is " + tabValue);
    });
  });
});

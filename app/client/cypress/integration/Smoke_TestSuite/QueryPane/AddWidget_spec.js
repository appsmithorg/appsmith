const queryLocators = require("../../../locators/QueryEditor.json");

let datasourceName;
let pluginid;
let datasourceId;
let userpermisssion = [];
let responseBody;

describe("Add widget", function() {
  beforeEach(() => {
    cy.createPostgresDatasource();
    cy.get("@saveDatasource").then(httpResponse => {
      datasourceName = httpResponse.response.body.data.name;
      pluginid = httpResponse.response.body.data.pluginId;
      datasourceId = httpResponse.response.body.data.id;
      userpermisssion = httpResponse.response.body.data.userPermissions;
      cy.log("userpermission:" + userpermisssion);
      cy.log("pluginid: " + pluginid);
      cy.log("datasourceName: " + datasourceName);
      cy.log("datasourceId: " + datasourceId);
    });
    cy.wait(4000);
  });

  it("Add widget", () => {
    cy.NavigateToQueryEditor();
    cy.contains(".t--datasource-name", datasourceName)
      .find(queryLocators.createQuery)
      .click();
    cy.wait("@createAction").then(httpResponse => {
      cy.log(JSON.stringify(httpResponse.response.body));
      expect(httpResponse.status).to.eq(201);
    });
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("select * from configs");
    cy.wait(500);
    cy.get(queryLocators.runQuery).click();
    cy.wait("@postExecute").then(httpResponse => {
      cy.log(JSON.stringify(httpResponse.response.body));
      expect(httpResponse.status).to.eq(200);
    });
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

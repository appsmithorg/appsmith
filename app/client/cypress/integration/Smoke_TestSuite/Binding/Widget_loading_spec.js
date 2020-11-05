const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/rundsl.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const testdata = require("../../../fixtures/testdata.json");

const pageid = "MyPage";
let updatedName;
let datasourceName;
let pluginid;
let datasourceId;
let userpermisssion = [];
let responseBody;

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Create a postgres datasource", function() {
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
  it("Create and runs query", () => {
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
      .type("select * from users limit 10");
    cy.EvaluateCurrentValue("select * from users limit 10");
    cy.get(queryLocators.runQuery).click();
    cy.wait("@postExecute").then(httpResponse => {
      cy.log(JSON.stringify(httpResponse.response.body));
      expect(httpResponse.status).to.eq(200);
    });
  });

  it("Button widget test with on action query run", function() {
    cy.SearchEntityandOpen("Button1");
    cy.executeDbQuery("Query1");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Input widget test with default value update with query data", function() {
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.defaultInputQuery);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Publish App and validate loading functionalty", function() {
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(widgetsPage.widgetBtn)
      .first()
      .click({ force: true });
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

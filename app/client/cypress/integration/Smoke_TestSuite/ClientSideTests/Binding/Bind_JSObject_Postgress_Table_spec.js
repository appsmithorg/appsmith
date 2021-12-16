const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/inputdsl.json");
const homePage = require("../../../../locators/HomePage.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const pages = require("../../../../locators/Pages.json");

let datasourceName;
let currentUrl;

describe("Addwidget from Query and bind with other widgets", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a query and populate response by choosing addWidget and validate in Table Widget", () => {
    cy.addDsl(dsl);
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      cy.NavigateToQueryEditor();
      cy.contains(".t--datasource-name", datasourceName)
        .find(queryLocators.createQuery)
        .click();
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
      cy.onlyQueryRun();
      cy.get(queryEditor.suggestedTableWidget).click();
      cy.createJSObject("return Query1.data;");
      cy.SearchEntityandOpen("Table1");
      cy.testJsontext("tabledata", "{{JSObject1.myFun1()}}");
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        const tabValue = tabData;
        cy.log("the value is" + tabValue);
        expect(tabValue).to.be.equal("5");
      });
    });
  });

  it("Bug 7413: On share as Public and App-viewer the JS object data is not visible to user", () => {
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.addDsl(dsl);
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;
      cy.NavigateToQueryEditor();
      cy.contains(".t--datasource-name", datasourceName)
        .find(queryLocators.createQuery)
        .click();
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
      cy.onlyQueryRun();
      cy.get(queryEditor.suggestedTableWidget).click();
      cy.createJSObject("return Query1.data;");
      cy.SearchEntityandOpen("Table1");
      cy.testJsontext("tabledata", "{{JSObject1.myFun1()}}");
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        const tabValue = tabData;
        cy.log("the value is" + tabValue);
        expect(tabValue).to.be.equal("5");
      });
      cy.get(homePage.shareApp).click();
      cy.enablePublicAccess();
      cy.PublishtheApp();
      cy.url().then((url) => {
        currentUrl = url;
        cy.log("Published url is: " + currentUrl);
        cy.get(publish.backToEditor).click();
        cy.visit(currentUrl);
        cy.wait("@getPagesForViewApp").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(3000);
        cy.tablefirstdataRow().then((tabValue) => {
          expect(tabValue).to.have.lengthOf(0);
          cy.log("Verified that JSObject is not visible for Public viewing");
        });
      });
    });
  });
});

const queryLocators = require("../../../../locators/QueryEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");
const dsl = require("../../../../fixtures/inputdsl.json");
const homePage = require("../../../../locators/HomePage.json");
const publish = require("../../../../locators/publishWidgetspage.json");

let datasourceName;
let currentUrl;

describe("Addwidget from Query and bind with other widgets", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a query and populate response by choosing addWidget and validate in Table Widget & Bug 7413", () => {
    cy.addDsl(dsl);
    cy.createPostgresDatasource();
    cy.get("@createDatasource").then((httpResponse) => {
      datasourceName = httpResponse.response.body.data.name;

      cy.NavigateToActiveDSQueryPane(datasourceName);
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
      cy.selectEntityByName("WIDGETS");
      cy.get(".t--entity-name")
        .contains("Table1")
        .click({ force: true });
      cy.testJsontext("tabledata", "{{JSObject1.myFun1()}}");
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "0").then((tabData) => {
        let tabValue = tabData;
        cy.log("the value is" + tabValue);
        expect(tabValue).to.be.equal("5");
      });
      cy.get(homePage.shareApp).click();
      cy.enablePublicAccess();
      cy.wait(3000);
      cy.PublishtheApp();
      cy.wait(3000);
      cy.url().then((url) => {
        currentUrl = url;
        cy.log("Published url is: " + currentUrl);
        cy.get(publish.backToEditor).click();
        cy.wait(2000);
        cy.visit(currentUrl);
        cy.wait("@getPagesForViewApp").should(
          "have.nested.property",
          "response.body.responseMeta.status",
          200,
        );
        cy.wait(3000);

        cy.isSelectRow(1);
        cy.readTabledataPublish("1", "0").then((tabData) => {
          let tabValue = tabData;
          cy.log("the value is after Publish: " + tabValue);
          expect(tabValue).to.be.equal("5");
          cy.log("Verified that JSObject is visible for Public viewing");
        });

        // cy.tablefirstdataRow().then((tabValue) => {
        //   expect(tabValue).to.be.equal("5");
        //   //expect(tabValue).to.have.lengthOf(0); // verification while JS Object was still Beta!
        //   //cy.log("Verified that JSObject is not visible for Public viewing");
        // });
      });
    });
  });
});

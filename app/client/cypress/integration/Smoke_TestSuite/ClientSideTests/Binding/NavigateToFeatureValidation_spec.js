const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/navigateTotabledsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/navigateToInputDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Table Widget with Input Widget and Navigate to functionality validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality with multiple page", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
  });

  it("Create MyPage and valdiate if its successfully created", function() {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("Validate NavigateTo Page functionality ", function() {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(4000);
    cy.PublishtheApp();
    cy.readTabledataPublish("1", "0").then((tabDataP) => {
      const tabValueP = tabDataP;
      cy.log(tabValueP);
      cy.isSelectRow(1);
      cy.get("input").should("be.visible");
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValueP);
    });
  });
});

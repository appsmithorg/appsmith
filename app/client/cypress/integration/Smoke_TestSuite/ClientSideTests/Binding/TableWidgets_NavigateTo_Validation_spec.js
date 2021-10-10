const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Table Widget and Navigate to functionality validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality with multiple page", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.get(widgetsPage.tableOnRowSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate to")
      .click();
    cy.enterNavigatePageName(pageid);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });

  it("Create MyPage and valdiate if its successfully created", function() {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("Validate NavigateTo Page functionality ", function() {
    cy.SearchEntityandOpen("Table1");
    //Below test to be enabled once the bug related to change of page in table in fixed
    //cy.get('.t--table-widget-next-page')
    //  .click();
    cy.PublishtheApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});

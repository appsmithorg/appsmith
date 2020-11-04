const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const testdata = require("../../../fixtures/testdata.json");
const dsl2 = require("../../../fixtures/displayWidgetDsl.json");
const explorer = require("../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Table Widget and Navigate to functionality validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality with multiple page", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.get(widgetsPage.tableActionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate To")
      .click();
    cy.enterActionValue(pageid);
    cy.get(commonlocators.editPropCrossButton).click();
  });

  it("Create MyPage and valdiate if its successfully created", function() {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    cy.wait(500);
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("Validate NavigateTo Page functionality ", function() {
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.wait(500);
      cy.get(widgetsPage.chartWidget).should("not.be.visible");
      //Below test to be enabled once the bug related to change of page in table in fixed
      //cy.get('.t--table-widget-next-page')
      //  .click();
      cy.PublishtheApp();
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      cy.get(widgetsPage.chartWidget).should("be.visible");
    });
  });
});

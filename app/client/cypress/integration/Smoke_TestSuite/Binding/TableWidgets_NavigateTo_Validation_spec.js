const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableWidgetDsl.json");
const pages = require("../../../locators/Pages.json");
const testdata = require("../../../fixtures/testdata.json");
const dsl2 = require("../../../fixtures/displayWidgetDsl.json");
const pageid = "MyPage";

describe("Table Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TablePagination));
    cy.get(
      ".t--property-control-onsearchtextchanged .t--open-dropdown-Select-Action",
    ).click();
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
    cy.get(".t--entity-name:contains(MyPage)");
  });

  it("Validate NavigateTo Page functionality ", function() {
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "2").then(tabData => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("Lindsay Ferguson");
      cy.log("the value is" + tabValue);
      cy.wait(500);
      cy.get(".t--widget-chartwidget").should("not.be.visible");
      //cy.get('.t--table-widget-next-page')
      //  .click();
      cy.PublishtheApp();
      cy.get(publish.searchInput)
        .first()
        .type(tabData);
      cy.get(".t--widget-chartwidget").should("be.visible");
    });
  });
});

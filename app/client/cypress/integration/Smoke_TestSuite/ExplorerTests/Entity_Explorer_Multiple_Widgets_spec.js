const tdsl = require("../../../fixtures/tableWidgetDsl.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/displayWidgetDsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const testdata = require("../../../fixtures/testdata.json");
const pages = require("../../../locators/Pages.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const explorer = require("../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Entity explorer tests related to widgets and validation", function() {
  it("Widget edit/delete/copy to clipboard validation", function() {
    cy.addDsl(dsl);
    cy.NavigateToEntityExplorer();
    cy.SearchEntityandOpen("Text1");
    cy.get(explorer.collapse)
      .last()
      .click({ force: true });
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
    cy.Createpage(pageid);
    cy.addDsl(tdsl);
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.NavigateToEntityExplorer();
    cy.GlobalSearchEntity("Table1");
    cy.get(explorer.collapse)
      .last()
      .click({ force: true });
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(7);
      expect($lis.eq(0)).to.contain("{{Table1.selectedRow}}");
      expect($lis.eq(1)).to.contain("{{Table1.selectedRowIndex}}");
      expect($lis.eq(2)).to.contain("{{Table1.tableData}}");
      expect($lis.eq(3)).to.contain("{{Table1.pageNo}}");
      expect($lis.eq(4)).to.contain("{{Table1.pageSize}}");
      expect($lis.eq(5)).to.contain("{{Table1.isVisible}}");
      expect($lis.eq(6)).to.contain("{{Table1.searchText}}");
    });
    cy.GlobalSearchEntity("Text1");
    cy.get(explorer.collapse)
      .last()
      .click({ force: true });
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
  });
});

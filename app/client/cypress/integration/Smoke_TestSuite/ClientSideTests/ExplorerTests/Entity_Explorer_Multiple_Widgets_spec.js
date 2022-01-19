const tdsl = require("../../../../fixtures/tableWidgetDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const testdata = require("../../../../fixtures/testdata.json");
const pages = require("../../../../locators/Pages.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Entity explorer tests related to widgets and validation", function() {
  it("Add a widget to default page and verify the properties", function() {
    cy.addDsl(dsl);
    cy.OpenBindings("Text1");
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
  });

  it("Create another page and add another widget and verify properties", function() {
    cy.Createpage(pageid);
    cy.addDsl(tdsl);
    cy.openPropertyPane("tablewidget");
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.GlobalSearchEntity("Table1");
    cy.OpenBindings("Table1");
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(12);
      expect($lis.eq(0)).to.contain("{{Table1.selectedRow}}");
      expect($lis.eq(1)).to.contain("{{Table1.selectedRows}}");
      expect($lis.eq(2)).to.contain("{{Table1.selectedRowIndices}}");
      expect($lis.eq(3)).to.contain("{{Table1.triggeredRow}}");
      expect($lis.eq(4)).to.contain("{{Table1.selectedRowIndex}}");
      expect($lis.eq(5)).to.contain("{{Table1.tableData}}");
      expect($lis.eq(6)).to.contain("{{Table1.pageNo}}");
      expect($lis.eq(7)).to.contain("{{Table1.pageSize}}");
      expect($lis.eq(8)).to.contain("{{Table1.isVisible}}");
      expect($lis.eq(9)).to.contain("{{Table1.searchText}}");
      expect($lis.eq(10)).to.contain("{{Table1.totalRecordsCount}}");
      expect($lis.eq(11)).to.contain("{{Table1.sortOrder}}");
    });
  });

  it("Toggle between widgets in different pages using search functionality", function() {
    cy.get(".t--entity-name")
      .contains("Page1")
      .click({ force: true });
    cy.wait(2000);
    cy.SearchEntityandOpen("Text1");
    cy.OpenBindings("Text1");
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

import {
  agHelper,
  entityExplorer,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";

describe("Entity explorer tests related to widgets and validation", function () {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Add a widget to default page and verify the properties", function () {
    cy.fixture("displayWidgetDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container4");
    entityExplorer.SelectEntityByName("Text1");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Text1",
      action: "Show bindings",
    });
    cy.get(jsEditor._propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
  });

  it("2. Create another page and add another widget and verify properties", function () {
    entityExplorer.AddNewPage("New blank page");
    cy.fixture("tableWidgetDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container3");
    entityExplorer.SelectEntityByName("Table1");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Table1",
      action: "Show bindings",
    });
    cy.get(jsEditor._propertyList).then(function ($lis) {
      expect($lis).to.have.length(13);
      expect($lis.eq(0)).to.contain("{{Table1.selectedRow}}");
      expect($lis.eq(1)).to.contain("{{Table1.selectedRows}}");
      expect($lis.eq(2)).to.contain("{{Table1.selectedRowIndices}}");
      expect($lis.eq(3)).to.contain("{{Table1.triggeredRow}}");
      expect($lis.eq(4)).to.contain("{{Table1.selectedRowIndex}}");
      expect($lis.eq(5)).to.contain("{{Table1.tableData}}");
      expect($lis.eq(6)).to.contain("{{Table1.filteredTableData}}");
      expect($lis.eq(7)).to.contain("{{Table1.pageNo}}");
      expect($lis.eq(8)).to.contain("{{Table1.pageSize}}");
      expect($lis.eq(9)).to.contain("{{Table1.isVisible}}");
      expect($lis.eq(10)).to.contain("{{Table1.searchText}}");
      expect($lis.eq(11)).to.contain("{{Table1.totalRecordsCount}}");
      expect($lis.eq(12)).to.contain("{{Table1.sortOrder}}");
    });
  });

  it("3. Toggle between widgets in different pages using search functionality", function () {
    entityExplorer.SelectEntityByName("Page1", "Pages");
    entityExplorer.ExpandCollapseEntity("Widgets");
    entityExplorer.ExpandCollapseEntity("Container4");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "Text1",
      action: "Show bindings",
    });
    cy.get(jsEditor._propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
  });
});

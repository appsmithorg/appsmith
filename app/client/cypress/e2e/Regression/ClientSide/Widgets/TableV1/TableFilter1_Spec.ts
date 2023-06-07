import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let dataSet: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  table = ObjectsRegistry.Table,
  homePage = ObjectsRegistry.HomePage,
  deployMode = ObjectsRegistry.DeployMode;

describe("Verify various Table_Filter combinations", function () {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
    cy.fixture("tablev1NewDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Adding Data to Table Widget", function () {
    ee.SelectEntityByName("Table1");
    propPane.UpdatePropertyFieldValue(
      "Table data",
      JSON.stringify(dataSet.TableInput),
    );
    agHelper.ValidateNetworkStatus("@updateLayout", 200);
    agHelper.PressEscape();
    deployMode.DeployApp();
  });

  it("2. Table Widget Search Functionality", function () {
    table.ReadTableRowColumnData(1, 3, "v1", 2000).then((cellData) => {
      expect(cellData).to.eq("Lindsay Ferguson");
      table.SearchTable(cellData);
      table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Lindsay Ferguson");
      });
    });
    table.RemoveSearchTextNVerify("2381224");

    table.SearchTable("7434532");
    table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
      expect(afterSearch).to.eq("Byron Fields");
    });
    table.RemoveSearchTextNVerify("2381224");
  });

  it("3. Verify Table Filter for 'contain'", function () {
    table.OpenNFilterTable("userName", "contains", "Lindsay");
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("Lindsay Ferguson");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("4. Verify Table Filter for 'does not contain'", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "does not contain", "Tuna");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("5. Verify Table Filter for 'starts with'", function () {
    table.ReadTableRowColumnData(4, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.OpenNFilterTable("productName", "starts with", "Avo");
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Avocado Panini");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "wich");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("productName", "ends with", "WICH");
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Chicken Sandwich");
    });
    table.RemoveFilterNVerify("2381224");
  });

  it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
    table.ReadTableRowColumnData(1, 4).then(($cellData) => {
      expect($cellData).to.eq("Tuna Salad");
    });
    table.OpenNFilterTable("userName", "ends with", "WICH");
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224");
  });

  it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef steak");
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.RemoveFilterNVerify("2381224", true);
  });

  it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
    table.ReadTableRowColumnData(2, 4).then(($cellData) => {
      expect($cellData).to.eq("Beef steak");
    });
    table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
    table.WaitForTableEmpty();
    table.RemoveFilterNVerify("2381224", true);
  });
});

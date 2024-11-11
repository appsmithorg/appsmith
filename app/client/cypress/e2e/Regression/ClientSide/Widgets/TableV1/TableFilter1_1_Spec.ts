import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Verify various Table_Filter combinations",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tablev1NewDsl");
    });

    it("1. Adding Data to Table Widget", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      _.propPane.UpdatePropertyFieldValue(
        "Table data",
        JSON.stringify(this.dataSet.TableInput),
      );
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200);
      _.agHelper.PressEscape();
      _.deployMode.DeployApp();
    });

    it("2. Table Widget Search Functionality", function () {
      _.table.ReadTableRowColumnData(1, 3, "v1", 2000).then((cellData) => {
        expect(cellData).to.eq("Lindsay Ferguson");
        _.table.SearchTable(cellData);
        _.table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
          expect(afterSearch).to.eq("Lindsay Ferguson");
        });
      });
      _.table.RemoveSearchTextNVerify("2381224");

      _.table.SearchTable("7434532");
      _.table.ReadTableRowColumnData(0, 3).then((afterSearch) => {
        expect(afterSearch).to.eq("Byron Fields");
      });
      _.table.RemoveSearchTextNVerify("2381224");
    });

    it("3. Verify Table Filter for 'contain'", function () {
      _.table.OpenNFilterTable("userName", "contains", "Lindsay");
      _.table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("Lindsay Ferguson");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("4. Verify Table Filter for 'does not contain'", function () {
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });
      _.table.OpenNFilterTable("productName", "does not contain", "Tuna");
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("5. Verify Table Filter for 'starts with'", function () {
      _.table.ReadTableRowColumnData(4, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.OpenNFilterTable("productName", "starts with", "Avo");
      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Avocado Panini");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("6. Verify Table Filter for 'ends with' - case sensitive", function () {
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });
      _.table.OpenNFilterTable("productName", "ends with", "wich");
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Chicken Sandwich");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("7. Verify Table Filter for 'ends with' - case insenstive", function () {
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });
      _.table.OpenNFilterTable("productName", "ends with", "WICH");
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Chicken Sandwich");
      });
      _.table.RemoveFilterNVerify("2381224");
    });

    it("8. Verify Table Filter for 'ends with' - on wrong column", function () {
      _.table.ReadTableRowColumnData(1, 4).then(($cellData) => {
        expect($cellData).to.eq("Tuna Salad");
      });
      _.table.OpenNFilterTable("userName", "ends with", "WICH");
      _.table.WaitForTableEmpty();
      _.table.RemoveFilterNVerify("2381224");
    });

    it("9. Verify Table Filter for 'is exactly' - case sensitive", function () {
      _.table.ReadTableRowColumnData(2, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.OpenNFilterTable("productName", "is exactly", "Beef steak");
      _.table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.RemoveFilterNVerify("2381224", true);
    });

    it("10. Verify Table Filter for 'is exactly' - case insensitive", function () {
      _.table.ReadTableRowColumnData(2, 4).then(($cellData) => {
        expect($cellData).to.eq("Beef steak");
      });
      _.table.OpenNFilterTable("productName", "is exactly", "Beef STEAK");
      _.table.WaitForTableEmpty();
      _.table.RemoveFilterNVerify("2381224", true);
    });
  },
);

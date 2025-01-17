import {
  agHelper,
  deployMode,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "16108 - Verify Table URL column bugs",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("tableV2WithUrlColumnDsl");
    });

    it("Verify click on URL column with display text takes to the correct link", function () {
      deployMode.DeployApp();
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("Profile pic");
      });
      table.ReadTableRowColumnData(3, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("Profile pic");
      });

      agHelper
        .GetElement(`${table._tableRowColumnData(0, 0, "v2")} a`)
        .should(
          "have.attr",
          "href",
          "https://randomuser.me/api/portraits/med/women/39.jpg",
        )
        .should("have.attr", "target", "_blank");
      agHelper
        .GetElement(`${table._tableRowColumnData(3, 0, "v2")} a`)
        .should(
          "have.attr",
          "href",
          "https://randomuser.me/api/portraits/med/men/52.jpg",
        )
        .should("have.attr", "target", "_blank");
    });
  },
);

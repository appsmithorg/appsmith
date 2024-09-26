import {
  agHelper,
  deployMode,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "16108 - Verify Table URL column bugs",
  { tags: ["@tag.Widget", "@tag.Table"] },
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
      table.AssertURLColumnNavigation(
        0,
        0,
        "http://host.docker.internal:4200/453-200x300.jpg",
        "v2",
      );
      table.AssertURLColumnNavigation(
        3,
        0,
        "http://host.docker.internal:4200/photo-1503469432756-4aae2e18d881.jpeg",
        "v2",
      );
    });
  },
);

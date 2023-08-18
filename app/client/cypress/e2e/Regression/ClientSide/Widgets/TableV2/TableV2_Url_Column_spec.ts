import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("16108 - Verify Table URL column bugs", function () {
  before(() => {
    _.agHelper.AddDsl("tableV2WithUrlColumnDsl");
  });

  it("Verify click on URL column with display text takes to the correct link", function () {
    _.deployMode.DeployApp();

    _.table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Profile pic");
    });

    _.table.ReadTableRowColumnData(3, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Profile pic");
    });

    _.table.AssertURLColumnNavigation(
      0,
      0,
      "https://randomuser.me/api/portraits/med/women/39.jpg",
      "v2",
    );
    _.table.AssertURLColumnNavigation(
      3,
      0,
      "https://randomuser.me/api/portraits/med/men/52.jpg",
      "v2",
    );
  });
});

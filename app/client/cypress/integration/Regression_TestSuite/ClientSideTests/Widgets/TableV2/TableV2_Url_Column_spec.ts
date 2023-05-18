import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  table = ObjectsRegistry.Table;

describe("16108 - Verify Table URL column bugs", function () {
  before(() => {
    cy.fixture("tableV2WithUrlColumnDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("Verify click on URL column with display text takes to the correct link", function () {
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Profile pic");
    });

    table.ReadTableRowColumnData(3, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Profile pic");
    });

    table.AssertURLColumnNavigation(
      0,
      0,
      "https://randomuser.me/api/portraits/med/women/39.jpg",
      "v2",
    );
    table.AssertURLColumnNavigation(
      3,
      0,
      "https://randomuser.me/api/portraits/med/men/52.jpg",
      "v2",
    );
  });
});

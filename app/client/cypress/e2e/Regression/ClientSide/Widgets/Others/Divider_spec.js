import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Divider Widget Functionality", function () {
  before(() => {
    cy.fixture("DividerDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Add new Divider", () => {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.DIVIDER,
      320,
      200,
    );
    //Open Existing Divider from created  list
    _.entityExplorer.SelectEntityByName("Divider1");
    _.entityExplorer.SelectEntityByName("Divider2");
  });
});

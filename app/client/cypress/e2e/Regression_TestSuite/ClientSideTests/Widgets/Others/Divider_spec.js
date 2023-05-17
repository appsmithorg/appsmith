const dsl = require("../../../../../fixtures/DividerDsl.json");
import { WIDGET } from "../../../../../locators/WidgetLocators";
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Divider Widget Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Add new Divider", () => {
    _.entityExplorer.DragDropWidgetNVerify(WIDGET.DIVIDER, 320, 200);
    //Open Existing Divider from created  list
    _.entityExplorer.SelectEntityByName("Divider1");
    _.entityExplorer.SelectEntityByName("Divider2");
  });
});

const explorer = require("../../../../../locators/explorerlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Statbox Widget Functionality", function () {
  before(() => {
    cy.fixture("dynamicHeightStatboxdsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Verify Statbox can be placed inside another widget", () => {
    cy.get(explorer.addWidget).click();
    // placing statbox widget inside container widget
    cy.dragAndDropToWidget("statboxwidget", "containerwidget", {
      x: 100,
      y: 100,
    });
    cy.openPropertyPaneWithIndex("statboxwidget", 1);
    cy.openPropertyPaneWithIndex("statboxwidget", 0);
  });
});

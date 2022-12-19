const dsl = require("../../../../../fixtures/dynamicHeightStatboxdsl.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const data = require("../../../../../fixtures/example.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Statbox Widget Functionality", function() {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.addDsl(dsl);
  });

  it("Verify Statbox can be placed inside another widget", () => {
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

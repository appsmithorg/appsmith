const dsl = require("../../../../fixtures/inputdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dynamicInput = require("../../../../locators/DynamicInput.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";
describe("Binding prompt", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Show binding prompt when there are no bindings in the editor", () => {
    entityExplorer.SelectEntityByName("Input1");
    cy.testJsontext("defaultvalue", " ");
    cy.get(dynamicInput.bindingPrompt).should("be.visible");
    cy.get(widgetsPage.defaultInput).type("{{");
    cy.get(dynamicInput.bindingPrompt).should("not.be.visible");
  });
});

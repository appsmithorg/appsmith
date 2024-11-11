import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../locators/Widgets.json");
const dynamicInput = require("../../../../locators/DynamicInput.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
describe("Binding prompt", { tags: ["@tag.Binding"] }, function () {
  before(() => {
    agHelper.AddDsl("inputdsl");
  });

  it("1. Show binding prompt when there are no bindings in the editor", () => {
    EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
    cy.testJsontext("defaultvalue", " ");
    cy.get(dynamicInput.bindingPrompt).should("be.visible");
    cy.get(widgetsPage.defaultInput).type("{{");
    cy.get(dynamicInput.bindingPrompt).should("not.be.visible");
  });
});

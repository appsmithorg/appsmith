const dsl = require("../../../../fixtures/debuggerDependencyDsl.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";

describe("Inspect Entity", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Check whether depedencies and references are shown correctly", function () {
    entityExplorer.SelectEntityByName("Input1");
    cy.testJsontext("defaultvalue", "{{Button1.text}}");
    cy.get(".t--debugger-count").click();
    cy.contains(".ads-v2-tabs__list-tab", "Inspect entity").click();
    cy.contains(".t--dependencies-item", "Button1").click();
    cy.contains(".t--dependencies-item", "Input1");
  });
});

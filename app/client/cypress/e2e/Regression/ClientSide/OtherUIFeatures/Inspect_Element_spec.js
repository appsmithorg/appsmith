import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Inspect Entity", function () {
  before(() => {
    _.agHelper.AddDsl("debuggerDependencyDsl");
  });
  it("1. Check whether depedencies and references are shown correctly", function () {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaultvalue", "{{Button1.text}}");
    _.debuggerHelper.OpenDebugger();
    cy.contains(".ads-v2-tabs__list-tab", "Inspect entity").click();
    cy.contains(".t--dependencies-item", "Button1").click();
    cy.contains(".t--dependencies-item", "Input1");
  });
});

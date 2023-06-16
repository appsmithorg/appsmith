import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Inspect Entity", function () {
  before(() => {
    cy.fixture("debuggerDependencyDsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });
  it("1. Check whether depedencies and references are shown correctly", function () {
    entityExplorer.SelectEntityByName("Input1");
    cy.testJsontext("defaultvalue", "{{Button1.text}}");
    agHelper.GetNClick(".t--debugger-count");
    cy.contains(".ads-v2-tabs__list-tab", "Inspect entity").click();
    cy.contains(".t--dependencies-item", "Button1").click();
    cy.contains(".t--dependencies-item", "Input1");
  });
});

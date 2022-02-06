const dsl = require("../../../../fixtures/debuggerDependencyDsl.json");

describe("Inspect Entity", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Check whether depedencies and references are shown correctly", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaulttext", "{{Button1.text}}");

    cy.get(".t--debugger").click();
    cy.contains(".react-tabs__tab", "Inspect entity").click();
    cy.contains(".t--dependencies-item", "Button1").click();
    cy.contains(".t--dependencies-item", "Input1");
  });
});

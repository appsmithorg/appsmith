const dsl = require("../../../../fixtures/inputdsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dynamicInput = require("../../../../locators/DynamicInput.json");
var appId = " ";

describe("Binding prompt", function() {
  before(() => {
    //appId = localStorage.getItem("applicationId");
    //cy.log("appID:" + appId);
    cy.addDsl(dsl);
  });

  it("Show binding prompt when there are no bindings in the editor", () => {
    cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaultvalue", " ");
    cy.get(dynamicInput.bindingPrompt).should("be.visible");
    cy.get(widgetsPage.defaultInput).type("{{");
    cy.get(dynamicInput.bindingPrompt).should("not.be.visible");
  });
});

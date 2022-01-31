const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Entity explorer tests related to widgets and validation", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Widget edit/delete/copy to clipboard validation", function() {
    cy.wait(30000);
    cy.selectEntityByName("WIDGETS");
    cy.selectEntityByName("Container4");
    cy.get(".t--entity-collapse-toggle")
      .eq(4)
      .click({ force: true });
    cy.get(".t--entity-name")
      .contains("Text1")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(4);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
    cy.get(".t--entity-name")
      .contains("Text1")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(4);
    cy.selectAction("Edit Name");
    cy.EditApiNameFromExplorer("TextUpdated");
    cy.get(".t--entity-name")
      .contains("TextUpdated")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(4);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{TextUpdated.isVisible}}");
      expect($lis.eq(1)).to.contain("{{TextUpdated.text}}");
    });
    cy.DeleteWidgetFromSideBar();
  });
});

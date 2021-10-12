const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Entity explorer tests related to widgets and validation", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Widget edit/delete/copy to clipboard validation", function() {
    cy.SearchEntityandOpen("Text1");
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
    cy.GlobalSearchEntity("Text1");
    cy.EditApiNameFromExplorer("TextUpdated");
    cy.GlobalSearchEntity("TextUpdated");
    cy.get(".widgets .t--entity-collapse-toggle")
      .last()
      .click();
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{TextUpdated.isVisible}}");
      expect($lis.eq(1)).to.contain("{{TextUpdated.text}}");
    });
    cy.DeleteWidgetFromSideBar();
  });
});

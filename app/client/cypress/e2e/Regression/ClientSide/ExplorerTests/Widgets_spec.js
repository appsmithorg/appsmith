const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Entity explorer tests related to widgets and validation", function () {
  before(() => {
    _.agHelper.AddDsl("displayWidgetDsl");
  });

  it("1. Widget edit/delete/copy to clipboard validation", function () {
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.selectEntityByName("Container4");
    cy.get(".t--entity-collapse-toggle").eq(4).click({ force: true });
    cy.get(".t--entity-name").contains("Text1").trigger("mouseover");
    cy.get("[data-testid='t--entity-item-Text1'] .entity-context-menu").click({
      force: true,
    });
    cy.selectAction("Show bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Text1.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Text1.text}}");
    });
    cy.get(".t--entity-name").contains("Text1").trigger("mouseover");
    cy.get("[data-testid='t--entity-item-Text1'] .entity-context-menu").click({
      force: true,
    });
    cy.selectAction("Edit name");
    cy.EditApiNameFromExplorer("TextUpdated");
    cy.get(".t--entity-name").contains("TextUpdated").trigger("mouseover");
    cy.get(
      "[data-testid='t--entity-item-TextUpdated'] .entity-context-menu",
    ).click({ force: true });
    cy.selectAction("Show bindings");
    cy.get(apiwidget.propertyList).then(function ($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{TextUpdated.isVisible}}");
      expect($lis.eq(1)).to.contain("{{TextUpdated.text}}");
    });
    cy.DeleteWidgetFromSideBar();
  });
});

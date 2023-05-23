const commonlocators = require("../../../../../locators/commonlocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgets = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Modal Widget Functionality", function () {
  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
    //cy.addDsl(dsl);
  });
  it("1. Add new Modal widget with other widgets", () => {
    cy.get(commonlocators.autoConvert).click({
      force: true,
    });
    cy.get(commonlocators.convert).click({
      force: true,
    });
    cy.get(commonlocators.refreshApp).click({
      force: true,
    });
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 300 });
    cy.get(".t--modal-widget").should("exist");
    cy.xpath("//button/span[contains(text(),'Close')]").click({
      force: true,
    });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 100, y: 200 });
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 10, y: 20 });
    cy.dragAndDropToCanvas("buttonwidget", { x: 20, y: 30 });
    cy.createModalWithButton("Modal1", "onClick");
    cy.xpath("//button/span[contains(text(),'Close')]").click({
      force: true,
    });
    cy.get(".t--draggable-inputwidgetv2").first().should("exist");
    cy.get(".t--draggable-inputwidgetv2").last().should("exist");
    cy.get(".t--draggable-buttonwidget").last().should("exist");
    cy.get(".t--modal-widget").should("not.exist");
  });
});

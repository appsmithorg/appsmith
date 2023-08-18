import * as _ from "../../../../support/Objects/ObjectsCore";

describe("lazy widget component render", () => {
  before(() => {
    _.agHelper.AddDsl("lazyRender");
  });

  it("1. Should check below the fold widgets are getting rendered", () => {
    cy.get(".tableWrap").should("exist");
    //should check that widgets present in the tab other than default tab renders
    cy.get(".t--tabid-tab2").trigger("click");
    cy.get(".t--draggable-ratewidget .bp3-icon-star").should("exist");

    //should check that widgets in modal are loading properly
    cy.get(".t--draggable-buttonwidget button").trigger("click", {
      force: true,
    });
    cy.get(".t--draggable-inputwidgetv2 input").should("exist");
  });
});

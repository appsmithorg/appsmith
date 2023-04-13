const dsl = require("../../../../fixtures/lazyRender.json");

describe("lazy widget component render", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("should check below the fold widgets are getting rendered", () => {
    cy.get(".tableWrap").should("exist");
  });

  it("should check that widgets present in the tab other than default tab renders", () => {
    cy.get(".t--tabid-tab2").trigger("click");
    cy.get(".t--draggable-ratewidget .bp3-icon-star").should("exist");
  });

  it("should check that widgets in modal are loading properly", () => {
    cy.get(".t--draggable-buttonwidget button").trigger("click", {
      force: true,
    });
    cy.get(".t--draggable-inputwidgetv2 input").should("exist");
  });
});

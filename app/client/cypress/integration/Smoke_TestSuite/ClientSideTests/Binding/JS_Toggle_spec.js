const dsl = require("../../../../fixtures/Js_toggle_dsl.json");

describe("JS Toggle tests", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("switches the toggle to Button widget", () => {
    cy.openPropertyPane("buttonwidget");
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();

    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .should("have.class", "is-active");

    cy.EnableAllCodeEditors();

    cy.testJsontext("visible", "false");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);

    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();

    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .should("not.have.class", "is-active");

    cy.get(".t--property-control-visible")
      .find("input")
      .should("not.have.attr", "checked");
  });
});

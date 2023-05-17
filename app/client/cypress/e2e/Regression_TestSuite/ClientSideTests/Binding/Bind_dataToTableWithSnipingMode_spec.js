const dsl = require("../../../../fixtures/tableWidgetDsl.json");

describe("Test Create Api and Bind to Table widget", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Test_Add users api, execute it and go to sniping mode.", function () {
    cy.createAndFillApi(this.data.userApi, "/mock-api?records=10");
    cy.RunAPI();
    cy.get(".t--select-in-canvas").click();
    cy.get(".t--sniping-mode-banner").should("be.visible");
    //Click on table name controller to bind the data and exit sniping mode
    cy.get(".t--draggable-tablewidget").trigger("mouseover");
    cy.get(".t--settings-sniping-control").click();
    cy.get(".t--property-control-tabledata .CodeMirror").contains(
      "{{Api1.data}}",
    );
    cy.get(".t--sniping-mode-banner").should("not.exist");
  });
});

import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    _.agHelper.AddDsl("tableV2WidgetDsl");
  });

  it("1. Test_Add users api, execute it and go to sniping mode.", function () {
    cy.createAndFillApi(this.dataSet.userApi, "/mock-api?records=10");
    cy.RunAPI();
    cy.get(".t--select-in-canvas").click();
    cy.get(".t--sniping-mode-banner").should("be.visible");
    //Click on table name controller to bind the data and exit sniping mode
    cy.get(".t--draggable-tablewidgetv2").trigger("mouseover");
    cy.get(".t--settings-sniping-control").click();
    cy.get(".t--property-control-tabledata .CodeMirror").contains(
      "{{Api1.data}}",
    );
    cy.get(".t--sniping-mode-banner").should("not.exist");
  });
});

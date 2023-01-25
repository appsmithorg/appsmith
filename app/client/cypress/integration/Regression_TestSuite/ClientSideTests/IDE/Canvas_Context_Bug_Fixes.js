const dsl = require("../../../../fixtures/Bugs/CheckboxGroupInListWidgetDsl.json");

describe("Canvas context Property Pane", function() {
  it("Bug Fix: Unable to delete checkbox child when it is inside list widget #18191", () => {
    cy.addDsl(dsl);
    cy.openPropertyPane("checkboxgroupwidget");
    //check number of options
    cy.get(".t--property-control-options > div:nth-child(2) > div").should(
      "have.length",
      3,
    );
    //click on delete button
    cy.get(
      ".t--property-control-options > div:nth-child(2) > div:nth-child(2) > button",
    ).click();

    //verify deletion
    cy.get(".t--property-control-options > div:nth-child(2) > div").should(
      "have.length",
      2,
    );
  });

  it("Bug Fix: widget explorer should automatically open on widget selection", () => {
    cy.reload();
    cy.CheckAndUnfoldEntityItem("Widgets");
    //check it was originally not expanded
    cy.get(`[data-guided-tour-id="explorer-entity-Image1"]`).should(
      "not.exist",
    );

    cy.get(".t--widget-imagewidget")
      .eq(0)
      .click();
    //check if the entities are not expanded
    cy.get(`[data-guided-tour-id="explorer-entity-Image1"]`).should("exist");
  });
});

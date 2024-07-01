import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Canvas context Property Pane", { tags: ["@tag.IDE"] }, function () {
  it("1. Bug 18191: Unable to delete checkbox child when it is inside list widget #18191", () => {
    _.agHelper.AddDsl("Bugs/CheckboxGroupInListWidgetDsl");
    cy.openPropertyPane("checkboxgroupwidget");
    //check number of options
    cy.get(
      `.t--property-control-options > div:nth-child(2) > div[orientation="HORIZONTAL"]`,
    ).should("have.length", 3);
    //click on delete button
    cy.get(
      ".t--property-control-options > div:nth-child(2) > div:nth-child(2) > button",
    ).click();

    //verify deletion
    cy.get(
      `.t--property-control-options > div:nth-child(2) > div[orientation="HORIZONTAL"]`,
    ).should("have.length", 2);
    // Deselect all widgets
    cy.get("body").type("{esc}");

    //Bug Fix: widget explorer should automatically open on widget selection
    cy.reload();

    cy.get(".t--widget-imagewidget").eq(0).click();
    //check if the entities are expanded
    cy.get(`[data-guided-tour-id="explorer-entity-Image1"]`).should("exist");
  });
});

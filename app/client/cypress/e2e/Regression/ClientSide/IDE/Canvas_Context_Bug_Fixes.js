describe("Canvas context Property Pane", { tags: ["@tag.IDE"] }, function () {
  it("1. Bug 18191: Unable to delete checkbox child when it is inside list widget #18191", () => {
    _.agHelper.AddDsl("Bugs/CheckboxGroupInListWidgetDsl");
    cy.openPropertyPane("checkboxgroupwidget");

    // Deselect all widgets
    cy.get("body").type("{esc}");

    //Bug Fix: widget explorer should automatically open on widget selection
    cy.reload();

    cy.get(".t--widget-imagewidget").eq(0).click();
    //check if the entities are expanded
    cy.get(`[data-guided-tour-id="explorer-entity-Image1"]`).should("exist");
  });
});

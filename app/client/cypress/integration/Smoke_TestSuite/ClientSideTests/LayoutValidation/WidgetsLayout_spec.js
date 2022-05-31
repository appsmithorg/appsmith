describe("Visual regression tests", () => {
  // for any changes in UI, update the screenshot in snapshot folder, to do so:
  //  1. Delete the required screenshot which you want to update
  //  2. Run test in headless mode with any browser (to maintain same resolution in CI)
  //  3. New screenshot will be generated in the snapshot folder

  it("Verify SwitchGroup inline enable/disbale", () => {
    cy.dragAndDropToCanvas("switchgroupwidget", { x: 300, y: 300 });
    cy.wait(1000);

    //Verify default check
    cy.get(".t--property-control-inline input").should("be.checked");
    // taking screenshot of switch container
    cy.get("[data-testid=switchgroup-container]").matchImageSnapshot(
      "inlineEnabled",
    );

    //Unchecking & verify snap
    cy.get(".t--property-control-inline input")
      .uncheck({ force: true })
      .wait(200)
      .should("not.be.checked");
    cy.get("[data-testid=switchgroup-container]").matchImageSnapshot(
      "inlineDisabled",
    );

    //Checking again & verify snap
    cy.get(".t--property-control-inline input")
      .check({ force: true })
      .wait(200)
      .should("be.checked");

    cy.get("[data-testid=switchgroup-container]").matchImageSnapshot(
      "inlineEnabled",
    );

    //Unchecking again & verify snap
    cy.get(".t--property-control-inline input")
      .uncheck({ force: true })
      .wait(200)
      .should("not.be.checked");
    // taking screenshot of app home page in edit mode
    cy.get("[data-testid=switchgroup-container]").matchImageSnapshot(
      "inlineDisabled",
    );
  });
});

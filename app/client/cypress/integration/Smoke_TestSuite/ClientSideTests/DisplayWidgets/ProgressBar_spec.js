const explorer = require("../../../../locators/explorerlocators.json");

describe("ProgressBar Widget Functionality", function() {
  it("Add new Progress Bar", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("progressbarwidget", { x: 300, y: 300 });
    cy.get(".t--progressbar-widget").should("exist");
  });

  it("Update Progress bar properties and validate", () => {
    // add progress value
    cy.testJsontext("progress", 30);
    // show result
    cy.get(".t--property-control-showresult .t--js-toggle").click({
      force: true,
    });
    cy.testJsontext("showresult", "true");
    cy.wait(200);
    cy.get(`.t--progressbar-widget > div[data-cy='${30}']`).should("exist");

    cy.get(".t--progressbar-widget > div")
      .eq(1)
      .should("have.text", "30%");
  });
});

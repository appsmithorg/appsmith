const explorer = require("../../../../../locators/explorerlocators.json");

describe("Progress Widget", function() {
  it("Add a new Progress widget and text widget", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("progresswidget", { x: 300, y: 300 });
    cy.get(".t--widget-progresswidget").should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", "");
  });

  // Linear progress
  it("Property: isIndeterminate, Toggle infinite loading", function() {
    cy.openPropertyPane("progresswidget");
    // enable infinite loading
    cy.togglebar(".t--property-control-infiniteloading input[type='checkbox']");
    // show indeterminate linear progress
    cy.get("[data-cy='indeterminate-linear-progress']")
      .should("exist")
      .should("have.css", "animation");
    // disable infinite loading
    cy.togglebarDisable(
      ".t--property-control-infiniteloading input[type='checkbox']",
    );
    // show determinate linear progress
    cy.get("[data-cy='50']").should("exist");
  });
  it("Property: value, Change progress value", function() {
    cy.updateCodeInput(".t--property-control-progress", "60");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // pass 60
    cy.get("[data-cy='60']").should("exist");
  });
  it("Property: showResult, Toggle show result", function() {
    // enable show result
    cy.togglebar(".t--property-control-showresult input[type='checkbox']");
    // show label
    cy.get("[data-cy='60']")
      .first()
      .next()
      .should("contain.text", "60");
    // disable show result
    cy.togglebarDisable(
      ".t--property-control-showresult input[type='checkbox']",
    );
    // does not show any label
    cy.get("[data-cy='60']")
      .first()
      .next()
      .should("not.exist");
  });
  it("Property: steps, Change steps", function() {
    cy.updateCodeInput(".t--property-control-numberofsteps", "2");
    // show progress with steps
    cy.get("[data-cy='step']").should("have.length", 2);
    cy.updateCodeInput(".t--property-control-numberofsteps", "1");
    // does not show progress with steps
    cy.get("[data-cy='step']").should("not.exist");
  });

  // Circular progress
  it("Property: type, Change type to Circular", function() {
    // Switch to circular mode
    cy.selectDropdownValue(".t--property-control-type", "Circular");
    cy.get("[data-cy='circular']").should("exist");
  });
  it("Property: isIndeterminate, Toggle infinite loading", function() {
    cy.openPropertyPane("progresswidget");
    // enable infinite loading
    cy.togglebar(".t--property-control-infiniteloading input[type='checkbox']");
    // show indeterminate linear progress
    cy.get("[data-cy='circular']")
      .should("exist")
      .should("have.css", "animation");
    // disable infinite loading
    cy.togglebarDisable(
      ".t--property-control-infiniteloading input[type='checkbox']",
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
  it("Property: value, Change progress value", function() {
    cy.updateCodeInput(".t--property-control-progress", "50");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // The path element with 50 should exist
    cy.get("[data-testvalue='50']").should("exist");
  });
  it("Property: showResult, Toggle show result", function() {
    // enable show result
    cy.togglebar(".t--property-control-showresult input[type='checkbox']");
    // show label
    cy.get("[data-cy='circular-label']").should("contain.text", "50");
    // disable show result
    cy.togglebarDisable(
      ".t--property-control-showresult input[type='checkbox']",
    );
    // does not show any label
    cy.get("[data-cy='circular-label']").should("not.exist");
  });
  it("Property: steps, Change steps", function() {
    cy.updateCodeInput(".t--property-control-numberofsteps", "2");
    // show circular progress with steps
    cy.get("[data-cy='separator']").should("have.length", 2);
    cy.updateCodeInput(".t--property-control-numberofsteps", "1");
    // does not show progress with steps
    cy.get("[data-cy='separator']").should("not.exist");
  });
  it("Property: counterClockwise,Change counterclockwise", function() {
    // enable counterclockwise
    cy.togglebar(
      ".t--property-control-counterclockwise input[type='checkbox']",
    );
    // show the progress in a counterclockwise
    cy.get("[data-testvalue='50']")
      .invoke("css", "stroke-dashoffset")
      .and("match", /-/);
    // disable counterclockwise
    cy.togglebarDisable(
      ".t--property-control-counterclockwise input[type='checkbox']",
    );
    // show the progress in a clockwise
    cy.get("[data-testvalue='50']")
      .invoke("css", "stroke-dashoffset")
      .should("not.match", /-/);
  });

  it("The binding property, progress should be exposed for an auto suggestion", function() {
    cy.openPropertyPane("textwidget");
    cy.get(
      ".t--property-control-text .CodeMirror textarea",
    ).type("{{Progress1.", { force: true });
    cy.get("ul.CodeMirror-hints")
      .contains("progress")
      .should("exist");
  });
});

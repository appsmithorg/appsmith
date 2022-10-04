const dsl = require("../../../../../fixtures/formHasChangesDsl.json");
var appId = " ";

describe("Form Widget", () => {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("Check hasChanges meta property", () => {
    // Check if isDirty is false for the first time
    cy.contains(".t--widget-textwidget", "false").should("exist");
    // Interact with UI
    cy.get(`.t--widget-checkboxwidget label`)
      .first()
      .click();
    // Check if isDirty is set to true
    cy.contains(".t--widget-textwidget", "false").should("not.exist");
    cy.contains(".t--widget-textwidget", "true").should("exist");
  });
});

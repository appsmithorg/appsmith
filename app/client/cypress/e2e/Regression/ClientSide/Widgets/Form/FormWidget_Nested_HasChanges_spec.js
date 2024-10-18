import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Form Widget", { tags: ["@tag.Widget", "@tag.Form", "@tag.Binding"] }, () => {
  before(() => {
    _.agHelper.AddDsl("formHasChangesDsl");
  });

  it("Check hasChanges meta property", () => {
    // Check if isDirty is false for the first time
    cy.contains(".t--widget-textwidget", "false").should("exist");
    // Interact with UI
    cy.get(`.t--widget-checkboxwidget label`).first().click();
    // Check if isDirty is set to true
    cy.contains(".t--widget-textwidget", "false").should("not.exist");
    cy.contains(".t--widget-textwidget", "true").should("exist");
  });
});

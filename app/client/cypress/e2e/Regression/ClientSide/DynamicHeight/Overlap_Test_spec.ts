import { agHelper, locators } from "../../../../support/Objects/ObjectsCore";

describe(
  "Fixed Invisible widgets and auto height containers",
  { tags: ["@tag.AutoHeight"] },
  () => {
    before(() => {
      // Create a page with a divider below a button widget and a checkbox widget below a filepicker widget
      // Button widget and filepicker widgets are fixed height widgets
      agHelper.AddDsl("autoHeightOverlapDSL");
    });

    it("1. Invisible widgets should not overlap when returning from preview mode to edit mode", () => {
      cy.get(locators._widgetInDeployed("textwidget"));
      agHelper.AssertContains("anything", "exist", "#ryq5qy60cg");

      agHelper.AssertElementVisibility(locators._previewModeToggle("edit"));
      agHelper.GetNClick(locators._previewModeToggle("edit"));

      agHelper.AssertElementVisibility(locators._previewModeToggle("preview"));
      agHelper.GetNClick(locators._previewModeToggle("preview"));

      cy.get("#ryq5qy60cg").should("have.css", "top", "136px");
      cy.get("#kx7mvoopqu").should("have.css", "top", "96px");
      cy.get("#m4doxmviiu").should("have.css", "top", "56px");
    });
  },
);

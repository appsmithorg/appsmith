const dsl = require("../../../../../fixtures/ButtonGroup_MenuButton_Width_dsl.json");

describe("In a button group widget, menu button width", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("If target width is smaller than min-width, The menu button popover width should be set to minimum width", () => {
    const minWidth = 12 * 11.9375;
    const widgetId = "yxjq5sck7d";
    // Get the default menu button
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .last()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        expect(targetWidth).to.be.lessThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${minWidth}px`,
        );
      });
  });

  it("If target width is bigger than min width, The menu button popover width should always be the same as the target width", () => {
    const minWidth = 12 * 11.9375;
    const widgetId = "t5l24fccio";
    const menuButtonId = "groupButton3";

    // Get the default menu button
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .last()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  it("After converting a simple button to a menu button, The menu button popover width should always be the same as the target width", () => {
    const minWidth = 12 * 11.9375;
    const widgetId = "t5l24fccio";
    const menuButtonId = "groupButton1";
    // Change the first button type to menu
    cy.editColumn(menuButtonId);
    cy.selectDropdownValue(".t--property-control-buttontype", "Menu");
    cy.get(".t--add-menu-item-btn").click();
    // Get the newly converted menu button
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .first()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  it("If an existing menu button width changes, its popover width should always be the same as the changed target width", () => {
    const minWidth = 12 * 11.9375;
    const widgetId = "t5l24fccio";
    const menuButtonId = "groupButton1";
    cy.get(".t--property-pane-back-btn").click();
    // Change the first button text
    cy.get(".t--property-pane-section-buttons input")
      .first()
      .type("increase width");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // Get the menu button with its width changed
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .first()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        expect(targetWidth).to.be.greaterThan(minWidth);
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  it("After changing the orientation to vertical , The menu button popover width should always be the same as the target width", () => {
    const widgetId = "mr048y04aq";
    const menuButtonId = "groupButton3";
    // Open property pane of ButtonGroup3
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .first()
      .click();
    // Change its orientation to vetical
    cy.selectDropdownValue(".t--property-control-orientation", "Vertical");
    // Get the default menu button
    cy.get(`.appsmith_widget_${widgetId} div.t--buttongroup-widget`)
      .children()
      .last()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        // Check if popover width is set to its target width
        cy.get(`.bp3-popover2.button-group-${widgetId}`).should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  after(() => {
    // clean up after done
  });
});

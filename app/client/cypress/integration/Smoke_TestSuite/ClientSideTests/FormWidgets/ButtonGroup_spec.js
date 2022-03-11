const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "buttongroupwidget";

describe("Button Group Widget Functionality", function() {
  before(() => {
    // no dsl required
  });

  it("Add new Button Group", () => {
    cy.wait(1000);
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("buttongroupwidget", { x: 300, y: 300 });
    cy.get(".t--buttongroup-widget").should("exist");
    cy.get(".t--buttongroup-widget")
      .children()
      .should("have.length", 3);
  });

  it("Verify buttons alignments", function() {
    // check first button placement
    cy.editColumn("groupButton1");
    // placement text
    cy.get(
      ".t--property-control-placement .bp3-popover-target span[type='p1']",
    ).should("have.text", "Center");
    // 1st btn
    cy.get(".t--buttongroup-widget > button > div").should(
      "have.css",
      "justify-content",
      "center",
    );
    cy.get(".t--buttongroup-widget .bp3-popover2-target > button > div").should(
      "have.css",
      "justify-content",
      "center",
    );
  });

  it("Update Placement and Verify buttons alignments", function() {
    // check first button placement
    cy.selectDropdownValue(
      ".t--property-control-placement .bp3-popover-target",
      "Between",
    );
    // 1st btn
    cy.get(".t--buttongroup-widget > button > div").should(
      "have.css",
      "justify-content",
      "space-between",
    );
    // update dropdown value
    cy.selectDropdownValue(
      ".t--property-control-placement .bp3-popover-target",
      "Start",
    );
    cy.get(".t--buttongroup-widget > button > div").should(
      "have.css",
      "justify-content",
      "start",
    );
    // other button style stay same
    cy.get(".t--buttongroup-widget .bp3-popover2-target > button > div").should(
      "have.css",
      "justify-content",
      "center",
    );
  });

  it("Update icon alignment and Verify buttons alignments", function() {
    // align right
    cy.get(".t--property-control-iconalignment .t--button-tab-left")
      .first()
      .click();
    cy.wait(200);
    // 1st btn
    cy.get(".t--buttongroup-widget > button > div")
      .eq(0)
      .should("have.css", "flex-direction", "row");
    // align left
    cy.get(".t--property-control-iconalignment .t--button-tab-right")
      .last()
      .click();
    cy.wait(200);
    // 1st btn
    cy.get(".t--buttongroup-widget > button > div")
      .eq(0)
      .should("have.css", "flex-direction", "row-reverse");
  });

  it("After being mounted, A menu button popover width should always be the same as the target width", () => {
    cy.closePropertyPane();
    // Get the default menu button
    cy.get(`.t--widget-${widgetName} div.t--buttongroup-widget`)
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
        cy.get(".bp3-popover2.menu-button-width-groupButton3").should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  it("After converting a simple button to a menu button, The menu button popover width should always be the same as the target width", () => {
    // Change the first button type to menu
    cy.openPropertyPane(widgetName);
    cy.editColumn("groupButton1");
    cy.selectDropdownValue(".t--property-control-buttontype", "Menu");
    cy.get(".t--add-menu-item-btn").click();
    cy.closePropertyPane();
    // Get the newly converted menu button
    cy.get(`.t--widget-${widgetName} div.t--buttongroup-widget`)
      .children()
      .first()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        // Check if popover width is set to its target width
        cy.get(".bp3-popover2.menu-button-width-groupButton1").should(
          "have.css",
          "width",
          `${targetWidth}px`,
        );
      });
  });

  it("If an existing menu button width changes, its popover width should always be the same as the changed target width", () => {
    // Change the first button text
    cy.openPropertyPane(widgetName);
    cy.get(".t--property-pane-section-buttons input")
      .first()
      .type("incrase width");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // Get the menu button with its width changed
    cy.get(`.t--widget-${widgetName} div.t--buttongroup-widget`)
      .children()
      .first()
      .as("target");
    // Open popover
    cy.get("@target").click();
    // Get the target width
    cy.get("@target")
      .invoke("outerWidth")
      .then((targetWidth) => {
        // Check if popover width is set to its target width
        cy.get(".bp3-popover2.menu-button-width-groupButton1").should(
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

const explorer = require("../../../../locators/explorerlocators.json");

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

  after(() => {
    // clean up after done
  });
});

const dsl = require("../../../../fixtures/menuButtonDsl.json");

const widgetName = ".t--widget-menubuttonwidget";
const iconAlignmentProperty = ".t--property-control-iconalignment";

describe("Menu Button Widget Functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Icon alignment should not change when changing the icon", () => {
    cy.openPropertyPane("menubuttonwidget");
    // Add an icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-add")
      .first()
      .click({
        force: true,
      });
    // Assert if the icon exists
    cy.get(`${widgetName} .bp3-icon-add`).should("exist");
    // Change its icon alignment to right
    cy.get(`${iconAlignmentProperty} .t--button-tab-right`)
      .last()
      .click({ force: true });
    cy.wait(200);
    // Assert if the icon appears on the right side of the button text
    cy.get(`${widgetName}`)
      .contains("Open Menu")
      .children("span")
      .should("have.length", 2);
    cy.get(`${widgetName} span.bp3-button-text`)
      .next()
      .should("have.class", "bp3-icon-add");
    // Change the existing icon
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-airplane")
      .first()
      .click({
        force: true,
      });
    // Assert if the icon changes
    // Assert if the icon still exists on the right side of the text
    cy.get(`${widgetName} .bp3-icon-airplane`)
      .should("exist")
      .prev()
      .should("have.text", "Open Menu");
  });
});

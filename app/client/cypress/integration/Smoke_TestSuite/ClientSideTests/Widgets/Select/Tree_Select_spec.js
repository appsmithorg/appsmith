const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe("Tree Select Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Add new widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("singleselecttreewidget", { x: 300, y: 300 });
    cy.get(".t--widget-singleselecttreewidget").should("exist");
  });

  it("2. toggle on allow clear selection and clear the input", () => {
    cy.openPropertyPane("singleselecttreewidget");
    // toggle on allow clear selection
    cy.togglebar(
      ".t--property-control-allowclearingvalue input[type='checkbox']",
    );
    // assert if cancel icon exists on the widget input
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-clear")
      .should("exist");
    // click on the cancel icon
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-clear")
      .click({ force: true });
    // assert if the widget input value is now empty
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .invoke("val")
      .should("be.empty");
    // click on the widget
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    // select Green option
    cy.treeSelectDropdown("Green");
    // again click on cancel icon in the widget
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-clear")
      .click({ force: true });
    // assert if the widget input value is now empty
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .invoke("val")
      .should("be.empty");
  });

  it("3. toggle of allow clear selection", () => {
    cy.openPropertyPane("singleselecttreewidget");
    // toggle off allow clear selection
    cy.togglebarDisable(
      ".t--property-control-allowclearingvalue input[type='checkbox']",
    );
    // assert if cancel icon does not exists on the widget input
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-clear")
      .should("not.exist");
    // click on the widget again
    cy.get(formWidgetsPage.treeSelectInput)
      .last()
      .click({ force: true });
    // select Green option
    cy.treeSelectDropdown("Green");
    // assert if the widget input value is Green
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-selection-item")
      .first()
      .should("have.text", "Green");
  });

  it("4. should check that empty value is allowed in options", () => {
    cy.openPropertyPane("singleselecttreewidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": "",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
  });

  it("5. should check that more than empty value is not allowed in options", () => {
    cy.openPropertyPane("singleselecttreewidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": "",
          "children": [
            {
              "label": "Dark Blue",
              "value": "DARK BLUE"
            },
            {
              "label": "Light Blue",
              "value": "LIGHT BLUE"
            }
          ]
        },
        {
          "label": "Green",
          "value": ""
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "exist",
    );
  });
});

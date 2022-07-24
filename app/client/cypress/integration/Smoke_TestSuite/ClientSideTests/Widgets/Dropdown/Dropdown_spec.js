const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
    cy.get(".t--widget-selectwidget").should("exist");
  });

  it("should check that empty value is allowed in options", () => {
    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": ""
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

  it("should check that more than one empty value is not allowed in options", () => {
    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Blue",
          "value": ""
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

  it("should check that Objects can be added to Select Widget default value", () => {
    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[{
          "label": "Blue",
          "value": "BLUE"
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }]`,
    );
    cy.updateCodeInput(".t--property-control-defaultvalue", "BLUE");
    cy.get(".t--property-control-options .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Blue");
  });

  it("should check that special strings are parsed as string in default value", () => {
    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(
      ".t--property-control-options",
      `[{
          "label": "Blue",
          "value": "null"
        },
        {
          "label": "Green",
          "value": 100
        },
        {
          "label": "Red",
          "value": "120"
        }]`,
    );
    cy.updateCodeInput(".t--property-control-defaultvalue", "null");
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Blue");

    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", "120");
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Red");

    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", "{{ 100 }}");
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "not.exist",
    );
    cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Green");

    cy.openPropertyPane("selectwidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", "{{ null }}");
    cy.get(".t--property-control-defaultvalue .t--codemirror-has-error").should(
      "exist",
    );
  });

  it("Dropdown Functionality To Check disabled Widget", function() {
    cy.openPropertyPane("selectwidget");
    // Disable the visible JS
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the disabled visible JS
    cy.get(publish.selectwidget + " " + "input").should("not.exist");
    cy.goToEditFromPublish();
  });

  it("Dropdown Functionality To UnCheck disabled Widget", function() {
    cy.openPropertyPane("selectwidget");
    // Check the visible JS
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    // Verify the checked visible JS
    cy.get(publish.selectwidget).should("exist");
    cy.goToEditFromPublish();
  });
});

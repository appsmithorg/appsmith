const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Dropdown Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Dropdown", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });

    it("Add new dropdown widget", () => {
      cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
      cy.get(".t--widget-selectwidget").should("exist");
    });

    it("should check that empty value is allowed in options", () => {
      cy.openPropertyPane("selectwidget");
      _.propPane.ToggleJSMode("sourcedata");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
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

      _.propPane.ToggleJSMode("label key");
      cy.updateCodeInput(
        ".t--property-control-wrapper.t--property-control-labelkey",
        `label`,
      );

      _.propPane.ToggleJSMode("value key");
      cy.updateCodeInput(".t--property-control-valuekey", `value`);

      cy.get(".t--property-control-valuekey .t--codemirror-has-error").should(
        "not.exist",
      );
    });

    it("should check that more than one empty value is not allowed in options", () => {
      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
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
      cy.get(".t--property-control-valuekey .t--codemirror-has-error").should(
        "exist",
      );
    });

    it("should check that Objects can be added to Select Widget default value", () => {
      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
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
      cy.updateCodeInput(".t--property-control-defaultselectedvalue", "BLUE");
      cy.get(".t--property-key .t--codemirror-has-error").should("not.exist");
      cy.get(
        ".t--property-control-defaultselectedvalue .t--codemirror-has-error",
      ).should("not.exist");
      cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Blue");
    });

    it("should check that special strings are parsed as string in default value", () => {
      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
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
      cy.updateCodeInput(".t--property-control-defaultselectedvalue", "null");
      cy.get(
        ".t--property-control-defaultselectedvalue .t--codemirror-has-error",
      ).should("not.exist");
      cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Blue");

      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(".t--property-control-defaultselectedvalue", "120");
      cy.get(
        ".t--property-control-defaultselectedvalue .t--codemirror-has-error",
      ).should("not.exist");
      cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Red");

      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalue",
        "{{ 100 }}",
      );
      cy.get(
        ".t--property-control-defaultselectedvalue .t--codemirror-has-error",
      ).should("not.exist");
      cy.get(formWidgetsPage.dropdownDefaultButton).should("contain", "Green");

      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalue",
        "{{ null }}",
      );
      cy.get(
        ".t--property-control-defaultselectedvalue .t--codemirror-has-error",
      ).should("exist");
    });

    it("Dropdown Functionality To Check disabled Widget", function () {
      cy.openPropertyPane("selectwidget");
      // Disable the visible JS
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      // Verify the disabled visible JS
      cy.get(publish.selectwidget + " " + "input").should("not.exist");
      _.deployMode.NavigateBacktoEditor();
    });

    it("Dropdown Functionality To UnCheck disabled Widget", function () {
      cy.openPropertyPane("selectwidget");
      // Check the visible JS
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      // Verify the checked visible JS
      cy.get(publish.selectwidget).should("exist");
    });
  },
);

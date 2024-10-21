const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "MultiSelect Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Multiselect", "@tag.Sanity", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });
    beforeEach(() => {
      cy.wait(3000);
    });
    it("1. Add new multiselect widget", () => {
      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MULTISELECT);
      //should check that empty value is allowed in options", () => {
      cy.openPropertyPane("multiselectwidgetv2");
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

      _.propPane.ToggleJSMode("labelkey");
      cy.updateCodeInput(
        ".t--property-control-wrapper.t--property-control-labelkey",
        `label`,
      );

      _.propPane.ToggleJSMode("valuekey");
      cy.updateCodeInput(".t--property-control-valuekey", `value`);

      cy.get(".t--property-control-valuekey .t--codemirror-has-error").should(
        "not.exist",
      );
    });

    it("2. should check that more that one empty value is not allowed in options", () => {
      cy.openPropertyPane("multiselectwidgetv2");
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

    it("3. should check that Objects can be added to multiselect Widget default value", () => {
      cy.openPropertyPane("multiselectwidgetv2");
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
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        `[
        {
          "label": "Green",
          "value": "GREEN"
        }
      ]`,
      );
      cy.get(".t--property-control-valuekey .t--codemirror-has-error").should(
        "not.exist",
      );
      cy.get(
        ".t--property-control-defaultselectedvalues .t--codemirror-has-error",
      ).should("not.exist");
      cy.wait(100);
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-item-content")
        .first()
        .should("have.text", "Green");
    });

    it("4. should display the right label", () => {
      cy.openPropertyPane("multiselectwidgetv2");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
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
        }
      ]`,
      );
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalues",
        `[
      "GREEN",
      "RED"
    ]`,
      );
      cy.get(".t--property-control-valuekey .t--codemirror-has-error").should(
        "not.exist",
      );
      cy.get(
        ".t--property-control-defaultselectedvalues .t--codemirror-has-error",
      ).should("not.exist");
      cy.wait(100);
      cy.get(formWidgetsPage.multiselectwidgetv2)
        .find(".rc-select-selection-item-content")
        .first()
        .should("have.text", "Green");
    });
  },
);

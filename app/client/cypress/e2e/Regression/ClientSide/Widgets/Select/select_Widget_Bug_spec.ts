/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Select Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formSelectDsl");
    });

    it("Select Widget name update", function () {
      cy.openPropertyPane("selectwidget");
      cy.widgetText(
        "Select1",
        widgetsPage.selectwidget,
        widgetsPage.widgetNameSpan,
      );
    });

    it("should check that virtualization works well", () => {
      cy.openPropertyPane("selectwidget");
      _.propPane.ToggleJSMode("sourcedata");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
          "label": "RANDOM",
          "value": "RANDOM"
        },
        {
          "label": "RANDOM1",
          "value": "RANDOM1"
        },
        {
          "label": "RANDOM2",
          "value": "RANDOM2"
        },
        {
          "label": "RANDOM3",
          "value": "RANDOM3"
        },
        {
          "label": "RANDOM4",
          "value": "RANDOM4"
        },
        {
          "label": "RANDOM5",
          "value": "RANDOM5"
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

      cy.get(".t--property-control-value .t--codemirror-has-error").should(
        "not.exist",
      );
      // Changing the option to the last item
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("RANDOM5")
        .click({
          force: true,
        });
      cy.wait(500);
      // Verifying the top items still renders
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("RANDOM1")
        .click({
          force: true,
        });
      // Add a longer list of item
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
          "label": "RANDOM",
          "value": "RANDOM"
        },
        {
          "label": "RANDOM1",
          "value": "RANDOM1"
        },
        {
          "label": "RANDOM2",
          "value": "RANDOM2"
        },
        {
          "label": "RANDOM3",
          "value": "RANDOM3"
        },
        {
          "label": "RANDOM4",
          "value": "RANDOM4"
        },
        {
          "label": "RANDOM5",
          "value": "RANDOM5"
        },
        {
          "label": "RANDOM6",
          "value": "RANDOM6"
        },
        {
          "label": "RANDOM7",
          "value": "RANDOM7"
        },
        {
          "label": "RANDOM8",
          "value": "RANDOM8"
        },
        {
          "label": "RANDOM9",
          "value": "RANDOM9"
        },
        {
          "label": "RANDOM10",
          "value": "RANDOM10"
        },
        {
          "label": "RANDOM11",
          "value": "RANDOM11"
        }

      ]`,
      );
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("RANDOM1")
        .click({
          force: true,
        });
      cy.wait(500);
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("RANDOM11")
        .should("not.exist");
    });

    it("should check that filtering works well", () => {
      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
          "label": "RANDOM",
          "value": "RANDOM"
        },
        {
          "label": "RANDOM1",
          "value": "RANDOM1"
        },
        {
          "label": "RANDOM2",
          "value": "RANDOM2"
        },
        {
          "label": "RANDOM3",
          "value": "RANDOM3"
        },
        {
          "label": "RANDOM4",
          "value": "RANDOM4"
        },
        {
          "label": "RANDOM5",
          "value": "RANDOM5"
        }
      ]`,
      );
      cy.get(".t--property-control-value .t--codemirror-has-error").should(
        "not.exist",
      );
      // Filtering the option
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.selectInputSearch).type("RANDOM5");
      // confirm it only has a single child
      cy.get(".select-popover-wrapper .menu-virtual-list")
        .children()
        .should("have.length", 1);
      cy.get(commonlocators.singleSelectWidgetMenuItem).contains("RANDOM5");
    });

    it("Disable the widget and check in publish mode", function () {
      cy.get(widgetsPage.disable).scrollIntoView({ force: true });
      cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
      cy.get(".bp3-disabled").should("be.visible");
      _.deployMode.DeployApp();
      cy.get(".bp3-disabled").should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("enable the widget and check in publish mode", function () {
      cy.openPropertyPane("selectwidget");
      cy.get(".bp3-disabled").should("be.visible");
      cy.get(widgetsPage.disable).scrollIntoView({ force: true });
      cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
      cy.get(".bp3-button").should("be.visible");

      // Set default value as RANDOM11
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalue",
        `{
        "label": "RANDOM5",
        "value": "RANDOM5"
      }`,
      );
      _.deployMode.DeployApp();
      cy.get(".bp3-button.select-button")
        .eq(0)
        .should("be.visible")
        .click({ force: true });
      cy.get(commonlocators.singleSelectActiveMenuItem).should(
        "contain.text",
        "RANDOM5",
      );
      _.deployMode.NavigateBacktoEditor();
    });
    it("should check that filtering works well using numeric labels", () => {
      cy.openPropertyPane("selectwidget");
      cy.updateCodeInput(
        ".t--property-control-sourcedata",
        `[
        {
          "label": 1,
          "value": "BLUE"
        },
        {
          "label": 2,
          "value": "GREEN"
        },
        {
          "label": "3",
          "value": "RED"
        }
      ]`,
      );
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 80 });
      cy.openPropertyPane("textwidget");
      cy.testJsontext("text", "{{typeof Select1.selectedOptionLabel}}");
      // Filtering the option
      cy.get(formWidgetsPage.selectWidget)
        .find(widgetsPage.dropdownSingleSelect)
        .click({
          force: true,
        });
      cy.get(commonlocators.selectInputSearch).type("1");
      // confirm it only has a single child
      cy.get(".select-popover-wrapper .menu-virtual-list")
        .children()
        .should("have.length", 1);
      cy.get(commonlocators.singleSelectWidgetMenuItem).contains("1");
      cy.get(commonlocators.singleSelectWidgetMenuItem).click({
        force: true,
      });
      cy.get(commonlocators.TextInside).first().should("have.text", "number");
    });
  },
);

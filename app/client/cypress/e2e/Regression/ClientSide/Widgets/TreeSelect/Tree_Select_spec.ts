import * as _ from "../../../../../support/Objects/ObjectsCore";

import formWidgetsPage from "../../../../../locators/FormWidgets.json";
import commonlocators from "../../../../../locators/commonlocators.json";

describe(
  "Tree Select Widget",
  { tags: ["@tag.Widget", "@tag.Select", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });

    it("1. Add new widget", () => {
      cy.dragAndDropToCanvas("singleselecttreewidget", { x: 300, y: 300 });
      cy.get(".t--widget-singleselecttreewidget").should("exist");
    });

    it("2. toggle on allow clear selection and clear the input", () => {
      cy.openPropertyPane("singleselecttreewidget");
      // toggle on allow clear selection
      _.agHelper.CheckUncheck(commonlocators.allowclearingValueInput);
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
      cy.wait(500)
        .get(formWidgetsPage.treeSelectInput)
        .last()
        .click({ force: true })
        .wait(500);
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
      _.agHelper.CheckUncheck(commonlocators.allowclearingValueInput, false);
      // assert if cancel icon does not exists on the widget input
      cy.get(formWidgetsPage.singleselecttreeWidget)
        .find(".rc-tree-select-clear")
        .should("not.exist");
      // click on the widget again
      cy.wait(500)
        .get(formWidgetsPage.treeSelectInput)
        .last()
        .click({ force: true })
        .wait(500);
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
  },
);

import { PageLeftPane } from "../../../../../support/Pages/EditorNavigation";

const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function dragAndDropToWidget(widgetType, destinationWidget, { x, y }) {
  const selector = `.t--widget-card-draggable-${widgetType}`;
  cy.wait(800);
  PageLeftPane.switchToAddNew();
  cy.get(selector)
    .first()
    .scrollIntoView()
    .trigger("dragstart", { force: true })
    .trigger("mousemove", x, y, { force: true });
  const selector2 = `.t--draggable-${destinationWidget}`;
  cy.get(selector2)
    .first()
    .scrollIntoView()
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
    .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
}

function deleteAllWidgetsInContainer() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .first()
    .click({
      force: true,
    });
  cy.get("body").type(`{${modifierKey}}{a}`);
  cy.wait(200);
  cy.get("body").type("{del}");
  cy.get(commonlocators.layoutControls).should("be.visible");
}

function checkSelectedRadioValue(selector, value) {
  /**
   * This function checks if the radio button is checked.
   * It also checks the value of the checked radio button.
   */
  cy.get(`${selector} input`).should("be.checked");
  cy.get(`${selector} input:checked`).should("have.value", value);
}

describe(
  "List widget v2 - Basic Child Widget Interaction",
  { tags: ["@tag.All", "@tag.List", "@tag.Sanity", "@tag.Binding"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("Listv2/emptyList");
      cy.get(publishLocators.containerWidget).should("have.length", 3);
    });

    it("1. Child widgets", () => {
      // Drop Input widget
      dragAndDropToWidget("inputwidgetv2", "containerwidget", {
        x: 250,
        y: 50,
      });
      _.agHelper.AssertAutoSave();

      // Verify drop
      cy.get(publishLocators.inputWidget).should("exist");

      // Type value
      cy.get(publishLocators.inputWidget).find("input").first().type("abcd");

      // Verify if the value got typed
      cy.get(publishLocators.inputWidget)
        .find("input")
        .should("have.value", "abcd");

      deleteAllWidgetsInContainer();

      // Drop Select widget
      dragAndDropToWidget("selectwidget", "containerwidget", {
        x: 250,
        y: 50,
      });

      // Verify drop
      cy.get(publishLocators.selectwidget).should("exist");

      _.deployMode.DeployApp();

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.selectwidget
            }`,
          )
          .should("have.length", 3),
      );

      // open the select widget
      cy.get(publishLocators.selectwidget)
        .eq(0)
        .find(widgetLocators.dropdownSingleSelect)
        .click({ force: true });
      // Select the Red option from dropdown list
      cy.get(commonlocators.singleSelectWidgetMenuItem)
        .contains("Red")
        .click({ force: true });

      // Assert if the select widget has Red as the selected value
      cy.get(publishLocators.selectwidget).contains("Red");
      _.deployMode.NavigateBacktoEditor();
      deleteAllWidgetsInContainer();

      // Drop Checkbox widget
      dragAndDropToWidget("checkboxgroupwidget", "containerwidget", {
        x: 250,
        y: 50,
      });

      // Verify drop
      cy.get(publishLocators.checkboxGroupWidget).should("exist");

      _.deployMode.DeployApp();

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.checkboxGroupWidget
            }`,
          )
          .should("have.length", 3),
      );

      cy.wait(2000); //for widgets to settle

      // select green & Verify Green selected

      cy.get(publishLocators.checkboxGroupWidget)
        .find(".bp3-checkbox")
        .contains("Green")
        .click({ force: true })
        .wait(500)
        .siblings("input")
        .should("be.checked");

      // Verify Blue selected
      cy.get(publishLocators.checkboxGroupWidget)
        .find(".bp3-checkbox")
        .contains("Blue")
        .siblings("input")
        .should("be.checked");
      _.deployMode.NavigateBacktoEditor();
      deleteAllWidgetsInContainer();

      // Drop Switch widget
      dragAndDropToWidget("switchwidget", "containerwidget", {
        x: 250,
        y: 50,
      });

      // Verify drop
      cy.get(publishLocators.switchwidget).should("exist");

      _.deployMode.DeployApp();

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.switchwidget
            }`,
          )
          .should("have.length", 3),
      );

      // Verify checked
      cy.get(publishLocators.switchwidget).find("input").should("be.checked");
      cy.wait(1000);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.switchwidget
            }`,
          )
          .should("have.length", 3),
      );
      // Uncheck & Verify unchecked
      cy.get(publishLocators.switchwidget)
        .find("label")
        .first()
        .click()
        .wait(500)
        .should("not.be.checked");

      _.deployMode.NavigateBacktoEditor();
      deleteAllWidgetsInContainer();
      cy.wait(800);
      // Drop Radio widget
      dragAndDropToWidget("radiogroupwidget", "containerwidget", {
        x: 250,
        y: 50,
      });

      // Verify drop
      cy.get(publishLocators.radioWidget).should("exist");

      _.deployMode.DeployApp();

      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.radioWidget
            }`,
          )
          .should("have.length", 3),
      );

      // Check radio with value=1 is selected
      checkSelectedRadioValue(publishLocators.radioWidget, "Y");
      cy.wait(1000);
      cy.waitUntil(() =>
        cy
          .get(
            `${widgetSelector("List1")} ${containerWidgetSelector} ${
              publishLocators.radioWidget
            }`,
          )
          .should("have.length", 3),
      );
      // Check option 2 and then check it's value:
      cy.get(`${publishLocators.radioWidget} input`).check("N", {
        force: true,
      });
      checkSelectedRadioValue(publishLocators.radioWidget, "N");
      _.deployMode.NavigateBacktoEditor();
    });
  },
);

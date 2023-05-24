const dsl = require("../../../../fixtures/autoLayoutCopyPaste.json");
const commonLocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const autoLayout = ObjectsRegistry.AutoLayout;

describe("Copy paste widget related tests for Auto layout", () => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    autoLayout.convertToAutoLayoutAndVerify(false);
    cy.addDsl(dsl);
  });

  it("1. Should paste at the bottom of the canvas that contains the selected widget", () => {
    cy.get(`.t--widget-buttonwidget`).first().click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //copying first button in first layer, which is center aligned
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get(commonLocators.toastmsg).contains("Copied");

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    //verify button widget pastes inside the container, in layer index 3 and is center aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".t--widget-containerwidget",
      ".t--widget-buttonwidget",
      3,
      "CENTER",
    );

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });
  });

  it("2. Should paste at the bottom of the canvas of the selected Container", () => {
    cy.get(`.t--widget-buttonwidget`).eq(1).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //copying second button in first layer, which is end aligned
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get(commonLocators.toastmsg).contains("Copied");

    cy.get(`.t--widget-containerwidget`).first().click({
      ctrlKey: true,
    });

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    //verify button widget pastes inside selected the container, in layer index 4 and is end aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".t--widget-containerwidget",
      ".t--widget-buttonwidget",
      4,
      "END",
    );

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });
  });

  it("3. Should paste at the bottom of the main canvas when no widget is selected", () => {
    cy.get(`.t--widget-buttonwidget`).eq(0).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //copying first button in first layer, which is center aligned
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get(commonLocators.toastmsg).contains("Copied");

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });

    cy.get(`div[data-testid='t--selected']`).should("have.length", 0);
    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    //verify button widget pastes in main canvas, in layer index 1 and is center aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".appsmith_widget_0",
      ".t--widget-buttonwidget",
      1,
      "CENTER",
    );

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });
  });

  it("4. Should paste widgets in copied orientation, when multiple widgets are copied", () => {
    //Select and copy widgets in,
    // button in layer index 0, end aligned
    cy.get(`.t--widget-buttonwidget`).eq(1).click({
      ctrlKey: true,
    });
    // button in layer index 1, start aligned
    cy.get(`.t--widget-buttonwidget`).eq(2).click({
      ctrlKey: true,
    });
    // icon button in layer index 1, end aligned
    cy.get(`.t--widget-iconbuttonwidget`).eq(0).click({
      ctrlKey: true,
    });
    // button in layer index 2, center aligned
    cy.get(`.t--widget-buttonwidget`).eq(3).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 4);
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get(commonLocators.toastmsg).contains("Copied");

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });

    cy.get(`div[data-testid='t--selected']`).should("have.length", 0);
    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    //verify widgets paste in copied orientation,
    // button in layer index 2, end aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".appsmith_widget_0",
      ".t--widget-buttonwidget",
      2,
      "END",
    );
    // button in layer index 3, start aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".appsmith_widget_0",
      ".t--widget-buttonwidget",
      3,
      "START",
    );
    // icon button in layer index 3, center aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".appsmith_widget_0",
      ".t--widget-iconbuttonwidget",
      3,
      "CENTER",
    );
    // button in layer index 4, center aligned
    autoLayout.verifyIfChildWidgetPositionInFlexContainer(
      ".appsmith_widget_0",
      ".t--widget-buttonwidget",
      4,
      "CENTER",
    );

    //unselect all widgets
    cy.get(`#div-selection-0`).click({
      force: true,
    });
  });
});

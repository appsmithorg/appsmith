import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Copy paste widget related tests for Auto layout", () => {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    _.autoLayout.ConvertToAutoLayoutAndVerify(false);
    cy.fixture("autoLayoutCopyPaste").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Should paste at the bottom of the canvas that contains the selected widget", () => {
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      0,
      true,
    );

    _.agHelper.AssertElementLength(_.locators._selectedWidget, 1);

    //copying first button in first layer, which is center aligned
    _.agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
    _.agHelper.GetElement(_.locators._toastMsg).contains("Copied");

    //paste
    _.agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
    cy.wait(1000);

    //verify button widget pastes inside the container, in layer index 3 and is center aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._widgetInDeployed(_.draggableWidgets.CONTAINER),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      3,
      "CENTER",
    );

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);
  });

  it("2. Should paste at the bottom of the canvas of the selected Container", () => {
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      1,
      true,
    );
    _.agHelper.AssertElementLength(_.locators._selectedWidget, 1);

    //copying second button in first layer, which is end aligned
    _.agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
    _.agHelper.GetElement(_.locators._toastMsg).contains("Copied");

    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.CONTAINER),
      0,
      true,
    );

    //paste
    _.agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
    cy.wait(1000);

    //verify button widget pastes inside selected the container, in layer index 4 and is end aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._widgetInDeployed(_.draggableWidgets.CONTAINER),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      4,
      "END",
    );

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);
  });

  it("3. Should paste at the bottom of the main canvas when no widget is selected", () => {
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      0,
      true,
    );
    _.agHelper.AssertElementLength(_.locators._selectedWidget, 1);

    //copying first button in first layer, which is center aligned
    _.agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
    _.agHelper.GetElement(_.locators._toastMsg).contains("Copied");

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);

    _.agHelper.AssertElementLength(_.locators._selectedWidget, 0);
    //paste
    _.agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
    cy.wait(1000);

    //verify button widget pastes in main canvas, in layer index 1 and is center aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._appsmithWidget("0"),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      1,
      "CENTER",
    );

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);
  });

  it("4. Should paste widgets in copied orientation, when multiple widgets are copied", () => {
    //Select and copy widgets in,
    // button in layer index 0, end aligned
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      1,
      true,
    );
    // button in layer index 1, start aligned
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      2,
      true,
    );
    // icon button in layer index 1, end aligned
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.ICONBUTTON),
      0,
      true,
    );
    // button in layer index 2, center aligned
    _.agHelper.GetNClick(
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      3,
      true,
    );
    _.agHelper.AssertElementLength(_.locators._selectedWidget, 4);
    _.agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
    _.agHelper.GetElement(_.locators._toastMsg).contains("Copied");

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);

    _.agHelper.AssertElementLength(_.locators._selectedWidget, 0);
    //paste
    _.agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
    cy.wait(1000);

    //verify widgets paste in copied orientation,
    // button in layer index 2, end aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._appsmithWidget("0"),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      2,
      "END",
    );
    // button in layer index 3, start aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._appsmithWidget("0"),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      3,
      "START",
    );
    // icon button in layer index 3, center aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._appsmithWidget("0"),
      _.locators._widgetInDeployed(_.draggableWidgets.ICONBUTTON),
      3,
      "CENTER",
    );
    // button in layer index 4, center aligned
    _.autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
      _.locators._appsmithWidget("0"),
      _.locators._widgetInDeployed(_.draggableWidgets.BUTTON),
      4,
      "CENTER",
    );

    //unselect all widgets
    _.agHelper.GetNClick(_.locators._selectionCanvas("0"), 0, true);
  });
});

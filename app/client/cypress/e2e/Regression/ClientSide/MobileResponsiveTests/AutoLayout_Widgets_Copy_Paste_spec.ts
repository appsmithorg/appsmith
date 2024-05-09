import {
  autoLayout,
  agHelper,
  locators,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Copy paste widget related tests for Auto layout",
  { tags: ["@tag.MobileResponsive"] },
  () => {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
      agHelper.Sleep(2000);
      agHelper.AddDsl("autoLayoutCopyPaste");
    });

    it("1. Should paste at the bottom of the canvas that contains the selected widget", () => {
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        0,
      );
      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 1);

      //copying first button in first layer, which is center aligned
      agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
      agHelper.GetElement(locators._toastMsg).contains("Copied");

      //paste
      agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
      cy.wait(1000);

      //verify button widget pastes inside the container, in layer index 3 and is center aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        3,
        "CENTER",
      );

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);
    });

    it("2. Should paste at the bottom of the canvas of the selected Container", () => {
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        1,
      );
      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 1);

      //copying second button in first layer, which is end aligned
      agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
      agHelper.GetElement(locators._toastMsg).contains("Copied");

      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        0,
      );

      //paste
      agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
      agHelper.Sleep(1000);

      //verify button widget pastes inside selected the container, in layer index 4 and is end aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        4,
        "END",
      );

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);
    });

    it("3. Should paste at the bottom of the main canvas when no widget is selected", () => {
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        0,
      );
      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 1);

      //copying first button in first layer, which is center aligned
      agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
      agHelper.GetElement(locators._toastMsg).contains("Copied");

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);

      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 0);
      cy.focused().blur();
      //paste
      agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
      agHelper.Sleep();

      //verify button widget pastes in main canvas, in layer index 1 and is center aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._appsmithWidget("0"),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        1,
        "CENTER",
      );

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);
    });

    it("4. Should paste widgets in copied orientation, when multiple widgets are copied", () => {
      //Select and copy widgets in,
      // button in layer index 0, end aligned
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        1,
        false,
        500,
        true,
      );
      // button in layer index 1, start aligned
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        2,
        false,
        500,
        true,
      );
      // icon button in layer index 1, end aligned
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
        0,
        false,
        500,
        true,
      );
      // button in layer index 2, center aligned
      agHelper.GetNClick(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        3,
        false,
        500,
        true,
      );
      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 4);
      agHelper.GetElement("body").type(`{${modifierKey}}{c}`);
      agHelper.GetElement(locators._toastMsg).contains("Copied");

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);
      cy.focused().blur();

      agHelper.AssertElementLength(locators._autoLayoutSelectedWidget, 0);

      //paste
      agHelper.GetElement("body").type(`{${modifierKey}}{v}`);
      agHelper.Sleep();

      //verify widgets paste in copied orientation,
      // button in layer index 2, end aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._appsmithWidget("0"),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        2,
        "END",
      );
      // button in layer index 3, start aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._appsmithWidget("0"),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        3,
        "START",
      );
      // icon button in layer index 3, center aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._appsmithWidget("0"),
        locators._widgetInDeployed(draggableWidgets.ICONBUTTON),
        3,
        "CENTER",
      );
      // button in layer index 4, center aligned
      autoLayout.VerifyIfChildWidgetPositionInFlexContainer(
        locators._appsmithWidget("0"),
        locators._widgetInDeployed(draggableWidgets.BUTTON),
        4,
        "CENTER",
      );

      //unselect all widgets
      agHelper.GetNClick(locators._selectionCanvas("0"), 0, true);
    });
  },
);

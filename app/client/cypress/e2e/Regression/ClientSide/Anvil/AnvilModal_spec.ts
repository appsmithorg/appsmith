import {
  agHelper,
  anvilLayout,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { anvilLocators } from "../../../../support/Pages/Anvil/Locators";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  `${ANVIL_EDITOR_TEST}: Anvil tests for Modals`,
  { tags: ["@tag.Anvil", "@tag.Visual"] },
  () => {
    before(() => {
      // Cleanup the canvas before each test
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
    });
    it("1. Verify opening a modal by clicking on a button", () => {
      // drop a modal widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSMODAL,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            dropModal: true,
          },
        },
      );
      // press escape and close modal
      agHelper.PressEscape();
      // add a button
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
        },
      );
      propPane.EnterJSContext("onClick", "{{showModal(Modal1.name);}}");
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
    });
    it("2. Verify closing a modal using the close icon button", () => {
      agHelper.GetNClick(
        anvilLocators.anvilModalCloseIconButtonSelector("Modal1"),
      );
      agHelper.AssertElementAbsence(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
    });
    it("3. Verify closing a modal by clicking outside the modal area", () => {
      // open modal
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
      // click on overlay top position
      agHelper.GetNClick(
        anvilLocators.anvilModalOverlay,
        0,
        false,
        500,
        false,
        false,
        "top",
      );
      agHelper.AssertElementAbsence(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
    });
    it("4. Verify closing a modal using the ESC key", () => {
      // open modal
      agHelper.GetNClick(anvilLocators.anvilWidgetNameSelector("Button1"));
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
      // press escape
      agHelper.PressEscape();
      agHelper.AssertElementAbsence(
        anvilLocators.anvilWidgetNameSelector("Modal1"),
      );
      agHelper.GetNClick(locators._exitPreviewMode);
    });
    it("5. verify onClose function of Modal", () => {
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.EnterJSContext("onClose", "{{showAlert('onCloseTest');}}");
      agHelper.GetNClick(locators._enterPreviewMode);
      //close modal via footer close button
      agHelper.GetNClick(
        anvilLocators.anvilModalFooterCloseButtonSelector("Modal1"),
      );
      //verify alert
      agHelper.ValidateToastMessage("onCloseTest");
      agHelper.GetNClick(locators._exitPreviewMode);
    });
    it("6. Verify onSubmit function on Modal", () => {
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      propPane.EnterJSContext("onSubmit", "{{showAlert('onSubmitTest');}}");
      agHelper.GetNClick(locators._enterPreviewMode);
      //close modal via submit button
      agHelper.GetNClick(
        anvilLocators.anvilModalFooterSubmitButtonSelector("Modal1"),
      );
      //verify alert
      agHelper.ValidateToastMessage("onSubmitTest");
      agHelper.GetNClick(locators._exitPreviewMode);
    });
    it("7. Verify DnD on Modal", () => {
      EditorNavigation.SelectEntityByName("Modal1", EntityType.Widget);
      // add a widget to modal
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSBUTTON,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            name: "Modal1",
          },
        },
      );
      // verify newly added button
      agHelper.AssertElementExist(
        anvilLocators.anvilWidgetNameSelector("Button2"),
      );
    });
    // TODO: Enable when issue(github.com/appsmithorg/appsmith/issues/36419) is solved.
    it.skip("8. Verify different modal sizes", () => {
      // select all widgets and delete
      agHelper.PressEscape();
      agHelper.SelectAllWidgets();
      agHelper.PressDelete();
      // add a modal widget
      anvilLayout.dnd.DragDropNewAnvilWidgetNVerify(
        anvilLocators.WDSMODAL,
        10,
        10,
        {
          skipWidgetSearch: true,
          dropTargetDetails: {
            dropModal: true,
          },
        },
      );
      agHelper
        .GetElement(anvilLocators.anvilWidgetNameSelector("Modal1"))
        .matchImageSnapshot("anvilModalMediumSize");
      propPane.SelectPropertiesDropDown("size", "Small");
      agHelper
        .GetElement(anvilLocators.anvilWidgetNameSelector("Modal1"))
        .matchImageSnapshot("anvilModalSmallSize");
      propPane.SelectPropertiesDropDown("size", "Large");
      agHelper
        .GetElement(anvilLocators.anvilWidgetNameSelector("Modal1"))
        .matchImageSnapshot("anvilModalLargeSize");
    });
  },
);

import {
  agHelper,
  assertHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation list widget",
  { tags: ["@tag.AutoHeight"] },
  function () {
    it("1. Validate change with auto height width for list widgets", function () {
      const textMsg = "Dynamic panel validation for text widget wrt height";
      agHelper.AddDsl("DynamicHeightListTextDsl");

      entityExplorer.DragDropWidgetNVerify("multiselecttreewidget", 300, 500);
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      //Widgets which were not possible to be added to list widget cannot be pasted/moved into the list widget with multitreeselect
      EditorNavigation.SelectEntityByName(
        "MultiTreeSelect1",
        EntityType.Widget,
        {},
        ["List1"],
      );
      agHelper.SimulateCopyPaste("copy");
      agHelper.WaitUntilAllToastsDisappear();
      agHelper.Sleep(2000);
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.MoveToTab("Style");
      agHelper.SimulateCopyPaste("paste");
      agHelper.ValidateToastMessage(
        "This widget cannot be used inside the list widget.",
        0,
        1,
      );
      agHelper
        .GetWidgetCSSHeight(locators._widgetInDeployed(draggableWidgets.LIST))
        .then((currentListHeight: any) => {
          //Widgets within list widget have no dynamic height
          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          //Widgets within list widget in existing applications have no dynamic height
          EditorNavigation.SelectEntityByName("Text1", EntityType.Widget, {}, [
            "List1",
            "Container1",
          ]);

          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          propPane.UpdatePropertyFieldValue("Text", textMsg, true);
          EditorNavigation.SelectEntityByName("Text2", EntityType.Widget, {}, [
            "Container1",
            "List1",
          ]);
          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          propPane.UpdatePropertyFieldValue("Text", textMsg, true);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.LIST),
            )
            .then((updatedListHeight: any) => {
              expect(currentListHeight).to.equal(updatedListHeight);
            });
          EditorNavigation.SelectEntityByName(
            "Container1",
            EntityType.Widget,
            {},
            ["List1"],
          );

          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          //Widgets when moved into the list widget have no dynamic height
          EditorNavigation.SelectEntityByName("Text3", EntityType.Widget);
          propPane.MoveToTab("Style");
          agHelper.SimulateCopyPaste("copy");

          EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
          propPane.MoveToTab("Style");
          agHelper.SimulateCopyPaste("paste");
          assertHelper.AssertNetworkStatus("@updateLayout", 200);

          EditorNavigation.SelectEntityByName("Text3Copy", EntityType.Widget);
          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          agHelper.SimulateCopyPaste("copy");
          agHelper.WaitUntilAllToastsDisappear();
          agHelper.Sleep(2000);
          agHelper.GetNClick(locators._canvasBody);
          cy.focused().blur();
          agHelper.SimulateCopyPaste("paste");
          assertHelper.AssertNetworkStatus("@updateLayout");
          //Widgets when moved out of the list widget have dynamic height in property pane
          EditorNavigation.SelectEntityByName(
            "Text3CopyCopy",
            EntityType.Widget,
          );
          agHelper.AssertElementVisibility(propPane._propertyPaneHeightLabel);

          agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.TEXT));
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.TEXT),
            )
            .then((height: any) => {
              propPane.SelectPropertiesDropDown("height", "Auto Height");
              assertHelper.AssertNetworkStatus("@updateLayout", 200);
              agHelper.GetNClick(
                locators._widgetInDeployed(draggableWidgets.TEXT),
              );
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.TEXT),
                )
                .wait(1000)
                .then((updatedListHeight: any) => {
                  expect(height).to.not.equal(updatedListHeight);
                });
            });
          EditorNavigation.SelectEntityByName(
            "Text3CopyCopy",
            EntityType.Widget,
          );
          agHelper.SimulateCopyPaste("copy");

          EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
          propPane.MoveToTab("Style");
          agHelper.SimulateCopyPaste("paste");
          assertHelper.AssertNetworkStatus("@updateLayout", 200);
          //Widgets when copied and pasted into the list widget no longer have dynamic height
          EditorNavigation.SelectEntityByName(
            "Text3CopyCopyCopy",
            EntityType.Widget,
            {},
            ["Container1"],
          );
          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
          agHelper.Sleep(2000); //wait a bit to ensure that the 'Text3CopyCopy' is selected for cut

          EditorNavigation.SelectEntityByName(
            "Text3CopyCopy",
            EntityType.Widget,
          );
          agHelper.SimulateCopyPaste("cut");
          EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
          propPane.MoveToTab("Style");
          agHelper.Sleep(500);
          agHelper.SimulateCopyPaste("paste");

          assertHelper.AssertNetworkStatus("@updateLayout", 200);
          agHelper.AssertElementAbsence(propPane._propertyPaneHeightLabel);
        });
    });
  },
);

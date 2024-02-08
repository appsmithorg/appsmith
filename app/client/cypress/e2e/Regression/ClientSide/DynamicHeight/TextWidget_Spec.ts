import {
  agHelper,
  locators,
  entityExplorer,
  propPane,
  deployMode,
  draggableWidgets,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Dynamic Height Width validation for text widget",
  { tags: ["@tag.AutoHeight"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
    });

    it("1. Text widget validation of height with dynamic height feature", function () {
      const textMsg =
        "Dynamic height validation for text widget validation with respect to Auto height";
      //changing the Text and verifying
      propPane.AssertPropertiesDropDownCurrentValue("Height", "Auto Height");

      propPane.AssertPropertiesDropDownValues("Height", [
        "Auto Height",
        "Auto Height with limits",
        "Fixed",
      ]);

      agHelper.GetHeight(locators._widgetInDeployed(draggableWidgets.TEXT));
      cy.get("@eleHeight").then(($initalHeight) => {
        propPane.UpdatePropertyFieldValue("Text", textMsg);
        propPane.MoveToTab("Style");
        propPane.SelectPropertiesDropDown("Font size", "L");
        assertHelper.AssertNetworkStatus("@updateLayout", 200); //for textMsg update
        agHelper.GetHeight(locators._widgetInDeployed(draggableWidgets.TEXT));
        cy.get("@eleHeight").then(($addedtextHeight) => {
          expect($addedtextHeight).to.not.equal($initalHeight);
          deployMode.DeployApp(locators._textWidgetInDeployed);
          agHelper
            .GetText(locators._textWidgetInDeployed)
            .then(($text: any) => {
              expect($text).to.eq(textMsg);
            });

          agHelper.AssertAttribute(
            locators._textWidgetStyleInDeployed,
            "font-size",
            "1.25rem", //for Font size 'L'
          );

          agHelper.GetHeight(locators._widgetInDeployed(draggableWidgets.TEXT));
          cy.get("@eleHeight").then(($deployedAutoHeight) => {
            expect($deployedAutoHeight).not.eq($initalHeight);
          });
        });
      });
    });
  },
);

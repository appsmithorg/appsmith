import {
  agHelper,
  draggableWidgets,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation",
  { tags: ["@tag.AutoHeight"] },
  () => {
    it("1. Validate change with auto height width for text widgets", function () {
      agHelper.AddDsl("alignmentWithDynamicHeightDsl");
      VerifyAttributeValues("height");
      VerifyAttributeValues("left");
    });

    function VerifyAttributeValues(attribName: string) {
      const widgetNames = ["Text1", "Text2", "Text3", "Text4"];
      let smallValues: any[] = [];
      let largeValues: any[] = [];
      let smallAfterLargeValues: any[] = [];

      agHelper.ClickButton("Small");
      for (let i = 0; i < widgetNames.length; i++) {
        GetWidgetCSSAttribute(widgetNames[i], i, attribName);
        AssignPropertyValues((value) => {
          smallValues[i] = value;
        });
      }

      agHelper.ClickButton("Large");
      for (let i = 0; i < widgetNames.length; i++) {
        GetWidgetCSSAttribute(widgetNames[i], i, attribName);
        AssignPropertyValues((value) => {
          largeValues[i] = value;
        });
      }

      cy.then(() => {
        if (attribName == "left") {
          for (let i = 0; i < widgetNames.length; i++) {
            expect(smallValues[i]).to.equal(largeValues[i]);
          }
        } else if (attribName == "height") {
          for (let i = 0; i < widgetNames.length; i++) {
            expect(smallValues[i]).to.not.equal(largeValues[i]);
          }
        }
      });

      agHelper.ClickButton("Small");
      for (let i = 0; i < widgetNames.length; i++) {
        GetWidgetCSSAttribute(widgetNames[i], i, attribName);
        AssignPropertyValues((value) => {
          smallAfterLargeValues[i] = value;
        });
      }
      cy.then(() => {
        for (let i = 0; i < widgetNames.length; i++) {
          expect(smallValues[i]).to.equal(smallAfterLargeValues[i]);
        }
      });
    }

    function GetWidgetCSSAttribute(
      widgetName: string,
      index: any,
      attribName: string,
    ) {
      EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
      agHelper.GetWidgetCSSValue(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        attribName,
        index,
      );
    }

    function AssignPropertyValues(callback: (value: any) => void) {
      cy.get("@cssAttributeValue").then(($currentValue: any) => {
        callback($currentValue);
      });
    }
  },
);

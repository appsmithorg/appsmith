import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for text widget", function () {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT);
  });

  it("1. Text widget validation of height with dynamic height feature", function () {
    const textMsg =
      "Dynamic height validation for text widget validation with respect to Auto height";
    //changing the Text and verifying
    _.propPane.AssertPropertiesDropDownCurrentValue("Height", "Auto Height");

    _.agHelper.GetHeight(_.locators._widgetInDeployed(_.draggableWidgets.TEXT));
    cy.get("@eleHeight").then(($initalHeight) => {
      _.propPane.UpdatePropertyFieldValue("Text", textMsg);
      _.propPane.MoveToTab("Style");
      _.propPane.SelectPropertiesDropDown("Font size", "L");
      _.assertHelper.AssertNetworkStatus("@updateLayout", 200); //for textMsg update
      _.agHelper.GetHeight(
        _.locators._widgetInDeployed(_.draggableWidgets.TEXT),
      );
      cy.get("@eleHeight").then(($addedtextHeight) => {
        expect($addedtextHeight).to.not.equal($initalHeight);
        _.deployMode.DeployApp(_.locators._textWidgetInDeployed);
        _.agHelper
          .GetText(_.locators._textWidgetInDeployed)
          .then(($text: any) => {
            expect($text).to.eq(textMsg);
          });

        _.agHelper.AssertAttribute(
          _.locators._textWidgetStyleInDeployed,
          "font-size",
          "1.25rem", //for Font size 'L'
        );

        _.agHelper.GetHeight(
          _.locators._widgetInDeployed(_.draggableWidgets.TEXT),
        );
        cy.get("@eleHeight").then(($deployedAutoHeight) => {
          expect($deployedAutoHeight).not.eq($initalHeight);
        });
      });
    });
  });
});

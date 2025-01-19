const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Form Widget with Input Functionality",
  { tags: ["@tag.All", "@tag.Form"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formWidgetWithInputValCheckDsl");
    });

    it("Check if the default value of text input is 0", function () {
      //Check if the Input widget is visible
      cy.get(widgetsPage.inputWidget).should("be.visible");

      //Do Submission
      _.agHelper.ClickButton("Submit");

      //Check if on submission if the notification toast appears with text containing input1: 0
      _.agHelper.ValidateToastMessage('{"Text1":"Form","Input1":0}');

      cy.get(widgetsPage.formButtonWidget)
        .contains("Reset")
        .scrollIntoView()
        .should("be.visible");
    });
  },
);

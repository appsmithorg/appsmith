import {
  agHelper,
  appSettings,
  assertHelper,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Bug:33601: resetWidget function causes the next async method to be undefined",
  { tags: ["@tag.JS"] },
  () => {
    it("1. Bug 33601", () => {
      homePage.NavigateToHome();
      homePage.ImportApp("resetWidgetBug33601.json");
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      PageLeftPane.expandCollapseItem("List1");
      PageLeftPane.expandCollapseItem("Container1");
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);

      agHelper.EnterInputText("Label", "Widget Input2");
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .first()
        .invoke("attr", "value")
        .should("contain", "Widget Input2");
      agHelper
        .GetAttribute(locators._imgWidgetInsideList, "src")
        .then((labelValue) => {
          expect(labelValue).not.to.contain("data:image/png;base64");
        });

      agHelper.ClickButton("Submit");
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .first()
        .invoke("attr", "value")
        .should("be.empty");
      assertHelper.WaitForNetworkCall("@postExecute");
      agHelper
        .GetAttribute(locators._imgWidgetInsideList, "src")
        .then((labelValue) => {
          expect(labelValue).to.contain("data:image/png;base64");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.EnterInputText("Label", "Widget Input2");
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .first()
        .invoke("attr", "value")
        .should("contain", "Widget Input2");
      agHelper
        .GetAttribute(locators._imgWidgetInsideList, "src")
        .then((labelValue) => {
          expect(labelValue).not.to.contain("data:image/png;base64");
        });
      agHelper.ClickButton("Submit");
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .first()
        .invoke("attr", "value")
        .should("be.empty");
      agHelper
        .GetAttribute(locators._imgWidgetInsideList, "src")
        .then((labelValue) => {
          expect(labelValue).to.contain("data:image/png;base64");
        });
    });
  },
);

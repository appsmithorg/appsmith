import {
  agHelper,
  assertHelper,
  deployMode,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate basic binding of Input widget to Input widget",
  { tags: ["@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("inputBindingdsl");
    });

    it("1. Input widget test with default value from another Input widget", () => {
      cy.fixture("testdata").then(function (dataSet: any) {
        //dataSet = data;
        EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
        propPane.UpdatePropertyFieldValue(
          "Default value",
          dataSet.defaultInputBinding + "}}",
        );
        assertHelper.AssertNetworkStatus("@updateLayout");
        //Binding second input widget with first input widget and validating
        EditorNavigation.SelectEntityByName("Input2", EntityType.Widget);
        propPane.UpdatePropertyFieldValue(
          "Default value",
          dataSet.momentInput + "}}",
        );
      });
      assertHelper.AssertNetworkStatus("@updateLayout");
      //Publish widget and validate the data displayed in input widgets
      let currentTime = new Date();
      deployMode.DeployApp(locators._widgetInputSelector("inputwidgetv2"));
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .first()
        .should("contain.value", currentTime.getFullYear());
      cy.get(locators._widgetInputSelector("inputwidgetv2"))
        .last()
        .should("contain.value", currentTime.getFullYear());
    });
  },
);

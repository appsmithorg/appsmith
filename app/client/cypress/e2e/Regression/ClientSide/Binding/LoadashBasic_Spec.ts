import {
  agHelper,
  locators,
  entityExplorer,
  assertHelper,
  propPane,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Loadash basic test with input Widget", () => {
  before(() => {
    agHelper.AddDsl("inputBindingdsl");
  });

  it("1. Input widget test with default value for atob method", () => {
    cy.fixture("testdata").then(function (dataSet: any) {
      entityExplorer.SelectEntityByName("Input1", "Widgets");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.defaultInputBinding + "}}",
      );
      assertHelper.AssertNetworkStatus("@updateLayout");
      //Input widget test with default value for btoa method
      entityExplorer.SelectEntityByName("Input2");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.loadashInput + "}}",
      );
    });
    assertHelper.AssertNetworkStatus("@updateLayout");
    //Publish and validate the data displayed in input widgets value for aToB and bToa
    deployMode.DeployApp(locators._widgetInputSelector("inputwidgetv2"));
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .first()
      .invoke("attr", "value")
      .should("contain", "7");
    cy.get(locators._widgetInputSelector("inputwidgetv2"))
      .last()
      .invoke("attr", "value")
      .should("contain", "7");
  });
});

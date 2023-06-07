import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Loadash basic test with input Widget", () => {
  before(() => {
    cy.fixture("inputBindingdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Input widget test with default value for atob method", () => {
    cy.fixture("testdata").then(function (dataSet: any) {
      _.entityExplorer.SelectEntityByName("Input1", "Widgets");
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.defaultInputBinding + "}}",
      );
      _.agHelper.AssertNetworkStatus("@updateLayout");
      //Input widget test with default value for btoa method
      _.entityExplorer.SelectEntityByName("Input2");
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.loadashInput + "}}",
      );
    });
    _.agHelper.AssertNetworkStatus("@updateLayout");
    //Publish and validate the data displayed in input widgets value for aToB and bToa
    _.deployMode.DeployApp(_.locators._widgetInputSelector("inputwidgetv2"));
    cy.get(_.locators._widgetInputSelector("inputwidgetv2"))
      .first()
      .invoke("attr", "value")
      .should("contain", "7");
    cy.get(_.locators._widgetInputSelector("inputwidgetv2"))
      .last()
      .invoke("attr", "value")
      .should("contain", "7");
  });
});

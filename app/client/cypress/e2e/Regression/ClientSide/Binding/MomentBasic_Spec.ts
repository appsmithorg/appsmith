import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Validate basic binding of Input widget to Input widget", () => {
  before(() => {
    cy.fixture("inputBindingdsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Input widget test with default value from another Input widget", () => {
    cy.fixture("testdata").then(function (dataSet: any) {
      //dataSet = data;
      _.entityExplorer.SelectEntityByName("Input1", "Widgets");
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.defaultInputBinding + "}}",
      );
      _.agHelper.AssertNetworkStatus("@updateLayout");
      //Binding second input widget with first input widget and validating
      _.entityExplorer.SelectEntityByName("Input2");
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.momentInput + "}}",
      );
    });
    _.agHelper.AssertNetworkStatus("@updateLayout");
    //Publish widget and validate the data displayed in input widgets
    let currentTime = new Date();
    _.deployMode.DeployApp(_.locators._widgetInputSelector("inputwidgetv2"));
    cy.get(_.locators._widgetInputSelector("inputwidgetv2"))
      .first()
      .should("contain.value", currentTime.getFullYear());
    cy.get(_.locators._widgetInputSelector("inputwidgetv2"))
      .last()
      .should("contain.value", currentTime.getFullYear());
  });
});

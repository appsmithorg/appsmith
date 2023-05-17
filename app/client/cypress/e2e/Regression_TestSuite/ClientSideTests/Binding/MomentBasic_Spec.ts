import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  propPane = ObjectsRegistry.PropertyPane,
  locator = ObjectsRegistry.CommonLocators,
  deployMode = ObjectsRegistry.DeployMode;

describe("Validate basic binding of Input widget to Input widget", () => {
  before(() => {
    cy.fixture("inputBindingdsl").then((val: any) => {
      agHelper.AddDsl(val);
    });

    cy.fixture("testdata").then(function (data: any) {
      dataSet = data;
    });
  });

  it("1. Input widget test with default value from another Input widget", () => {
    ee.SelectEntityByName("Input1", "Widgets");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.defaultInputBinding + "}}",
    );
    agHelper.ValidateNetworkStatus("@updateLayout");
    //Binding second input widget with first input widget and validating
    ee.SelectEntityByName("Input2");
    propPane.UpdatePropertyFieldValue(
      "Default value",
      dataSet.momentInput + "}}",
    );
    agHelper.ValidateNetworkStatus("@updateLayout");
    //Publish widget and validate the data displayed in input widgets
    let currentTime = new Date();
    deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"));
    cy.get(locator._widgetInputSelector("inputwidgetv2"))
      .first()
      .should("contain.value", currentTime.getFullYear());
    cy.get(locator._widgetInputSelector("inputwidgetv2"))
      .last()
      .should("contain.value", currentTime.getFullYear());
  });
});

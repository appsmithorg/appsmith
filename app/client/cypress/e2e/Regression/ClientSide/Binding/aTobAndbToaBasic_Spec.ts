import { ObjectsRegistry } from "../../../../support/Objects/Registry";

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
  });

  it("1. Input widget test with default value for atob method", () => {
    cy.fixture("testdata").then(function (dataSet: any) {
      ee.SelectEntityByName("Input1", "Widgets");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.atobInput + "}}",
      );
      agHelper.ValidateNetworkStatus("@updateLayout");
      cy.get(locator._inputWidget)
        .first()
        .invoke("attr", "value")
        .should("equal", "A"); //Before mapping JSObject value of input
      //Input widget test with default value for btoa method"
      ee.SelectEntityByName("Input2");
      propPane.UpdatePropertyFieldValue(
        "Default value",
        dataSet.btoaInput + "}}",
      );
    });
    agHelper.ValidateNetworkStatus("@updateLayout");
    cy.get(locator._inputWidget)
      .last()
      .invoke("attr", "value")
      .should("equal", "QQ=="); //Before mapping JSObject value of input
  });

  it("2. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
    deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"));
    cy.get(locator._widgetInputSelector("inputwidgetv2"))
      .first()
      .invoke("attr", "value")
      .should("contain", "A");
    cy.get(locator._widgetInputSelector("inputwidgetv2"))
      .last()
      .invoke("attr", "value")
      .should("contain", "QQ==");
  });
});

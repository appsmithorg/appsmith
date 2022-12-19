import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    propPane = ObjectsRegistry.PropertyPane,
    locator = ObjectsRegistry.CommonLocators,
    deployMode = ObjectsRegistry.DeployMode;

describe("Validate basic binding of Input widget to Input widget", () => {

    before(() => {
        cy.fixture('inputBindingdsl').then((val: any) => {
            agHelper.AddDsl(val)
        });

        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Input widget test with default value from another Input widget", () => {
        ee.SelectEntityByName("Input1", 'Widgets')
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("2. Binding second input widget with first input widget and validating", function () {
        ee.SelectEntityByName("Input2")
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.momentInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("3. Publish widget and validate the data displayed in input widgets", function () {
        var currentTime = new Date();
        deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"))
        cy.get(locator._widgetInputSelector("inputwidgetv2")).first()
            .should("contain.value", currentTime.getFullYear());
        cy.get(locator._widgetInputSelector("inputwidgetv2")).last()
            .should("contain.value", currentTime.getFullYear());
    });
});
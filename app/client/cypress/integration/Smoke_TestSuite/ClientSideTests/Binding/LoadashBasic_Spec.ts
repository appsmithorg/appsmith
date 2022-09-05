import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    propPane = ObjectsRegistry.PropertyPane,
    locator = ObjectsRegistry.CommonLocators,
    deployMode = ObjectsRegistry.DeployMode;

describe("Loadash basic test with input Widget", () => {

    before(() => {
        cy.fixture('inputBindingdsl').then((val: any) => {
            agHelper.AddDsl(val)
        });

        cy.fixture("testdata").then(function (data: any) {
            dataSet = data;
        });
    });

    it("1. Input widget test with default value for atob method", () => {
        ee.SelectEntityByName("Input1", 'Widgets')
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("2. Input widget test with default value for btoa method", function () {
        ee.SelectEntityByName("Input2")
        propPane.UpdatePropertyFieldValue("Default Value", dataSet.loadashInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("3. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
        deployMode.DeployApp(locator._widgetInputSelector("inputwidgetv2"))
        cy.get(locator._widgetInputSelector("inputwidgetv2")).first().invoke("attr", "value")
            .should("contain", "7")
        cy.get(locator._widgetInputSelector("inputwidgetv2")).last().invoke("attr", "value")
            .should("contain", "7");
    });
});
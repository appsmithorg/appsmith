import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    jsEditor = ObjectsRegistry.JSEditor,
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
        ee.SelectEntityByName("Input1", 'WIDGETS')
        jsEditor.EnterJSContext("Default Text", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("2. Input widget test with default value for btoa method", function () {
        ee.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("Default Text", dataSet.loadashInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("3. Publish and validate the data displayed in input widgets value for aToB and bToa", function () {
        deployMode.DeployApp(locator._inputWidgetInDeployed)
        cy.get(locator._inputWidgetInDeployed).first().invoke("attr", "value")
            .should("contain", "7")
        cy.get(locator._inputWidgetInDeployed).last().invoke("attr", "value")
            .should("contain", "7");
    });
});

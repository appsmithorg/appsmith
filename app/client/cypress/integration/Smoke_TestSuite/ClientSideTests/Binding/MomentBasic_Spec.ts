import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let dataSet: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    jsEditor = ObjectsRegistry.JSEditor,
    locator = ObjectsRegistry.CommonLocators;

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
        ee.expandCollapseEntity("WIDGETS")
        ee.SelectEntityByName("Input1")
        jsEditor.EnterJSContext("defaulttext", dataSet.defaultInputBinding + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("2. Binding second input widget with first input widget and validating", function () {
        ee.SelectEntityByName("Input2")
        jsEditor.EnterJSContext("defaulttext", dataSet.momentInput + "}}");
        agHelper.ValidateNetworkStatus('@updateLayout')
    });

    it("3. Publish widget and validate the data displayed in input widgets", function () {
        var currentTime = new Date();
        agHelper.DeployApp()
        cy.get(locator._inputWidgetInDeployed).first()
            .should("contain.value", currentTime.getFullYear());
        cy.get(locator._inputWidgetInDeployed).last()
            .should("contain.value", currentTime.getFullYear());
    });
});